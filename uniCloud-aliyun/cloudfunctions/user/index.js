// 'use strict';
const {
	appId,
	appSecret,
	getToken,
	verifyInfo
} = require("wx-common");
const db = uniCloud.database()
const createTime = new Date().getTime()
const default_head =
	'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-54f1765b-5282-47cf-8405-d6f9ccf838c3/71473287-ddb9-460e-961c-d9e6e8a574bc.png'
exports.main = async (event, context) => {
	switch (event.action) {
		case 'login': {
			return login(event.params)
		}
		case 'getInfo': {
			return getInfo(event.params)
		}
		case 'update': {
			return update(event.params)
		}
		default: {
			return
		}
	}
}

async function login(event) {
	const wxdata = await uniCloud.httpclient.request(
		`https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${event.code}&grant_type=authorization_code`, {
			dataType: "json"
		}
	)
	console.log(wxdata);
	if (wxdata.data.errcode) {
		return {
			code: 500,
			msg: `微信请求错误码：${wxdata.data.errcode}`,
		}
	}
	let openId = wxdata.data.openid;
	//获取user表
	const collection = db.collection('user-info');
	const res = await collection.where({
		openId: openId,
	}).get()
	if (res.data.length > 0) {
		let result = res.data[0]
		await collection.doc(result._id).update({
			updateTime: createTime,
		})
		delete result.openId
		// 生成token
		let token = getToken(result)
		return {
			code: 200,
			msg: '登录成功',
			data: {
				userInfo: result,
				token: token
			}
		}
	}

	const count = await collection.count()
	// 新增并返回用户信息
	let userData = {
		nickName: `用户${10000+count.total}`,
		id: 10000 + count.total,
		gender: 0,
		city: '',
		province: '',
		country: '',
		avatarUrl: default_head,
		openId,
		background: '',
		role: 0,
		level: 0,
		createTime,
		updateTime: createTime,
		event: {}
	}
	let add_info = await db.collection("user-info").add(userData)
	delete userData.openId
	userData._id = add_info.id
	let token = getToken(userData)
	return {
		code: 200,
		msg: '新增用户成功',
		data: {
			userInfo: userData,
			token: token
		}
	}
}

async function getInfo(event) {
	let userInfo = verifyInfo(event.token)
	if (userInfo.code) return userInfo
	const collection = db.collection('user-info')
	let res = await collection.doc(userInfo._id).get()
	return {
		code: 200,
		msg: '获取成功!',
		data: res.data[0]
	}

}

async function update(event) {
	let userInfo = verifyInfo(event.token)
	if (userInfo.code) return userInfo
	const collection = db.collection('user-info')
	if (event.nickName) {
		let repeat = await collection.where({
			nickName: event.nickName
		}).count()
		console.log(repeat)
		if (repeat.total > 0) {
			return {
				code: 300,
				msg: '该昵称已存在',
			}
		}
	}
	if (event.avatarUrl) {
		let result = await collection.doc(userInfo._id).get()
		if (result.data[0].avatarUrl != default_head) {
			uniCloud.deleteFile({
				fileList: [result.data[0].avatarUrl]
			})
		}
	}
	if (event.background || event.background == '') {
		let result = await collection.doc(userInfo._id).get()
		uniCloud.deleteFile({
			fileList: [result.data[0].background]
		})
	}
	delete event.token
	let res = await collection.doc(userInfo._id).update(event)
	return {
		code: 200,
		msg: '修改成功!',
	}

}