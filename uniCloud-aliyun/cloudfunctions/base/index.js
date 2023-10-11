'use strict';
const db = uniCloud.database()
const {
	verifyInfo
} = require("wx-common");
const createTime = new Date().getTime()
var userInfo;
exports.main = async (event, context) => {
	const {
		params,
		action
	} = event
	userInfo = verifyInfo(params.token)
	if (userInfo.code) return userInfo
	delete params.token
	switch (action) {
		case 'add': {
			return add(params)
		}
		case 'remove': {
			return remove(params)
		}
		case 'edit': {
			return edit(params)
		}
		case 'list': {
			return list(params)
		}
		case 'detail': {
			return detail(params)
		}
		default: {
			return {
				code: 404,
				msg: "未查找到相关方法"
			}
		}
	}
};

// 增
async function add(event) {
	const {
		name,
		phone,
		address
	} = event
	const collection = db.collection('base-list')
	const res = await collection.add({
		name,
		phone,
		address,
		create_time: createTime,
		creator_id: userInfo._id,
		qrcode: '',
	})

	const qrcode = await uniCloud.callFunction({
		name: "qrcode",
		data: {
			action: "create",
			params: {
				path: "pages/index/index",
				scene: res.id,
				time: createTime,
			}
		}
	})
	await collection.doc(res.id).update({
		qrcode: qrcode.result
	})

	return {
		code: 200,
		msg: "生成成功!",
		data: {
			shareImg: qrcode.result,
			id: res.id
		}
	}
}
// 删
async function remove(event) {
	console.log(event);
	const collection = db.collection('base-list')
	// 将删除的数据添加到临时库
	let data = await collection.doc(event.id).get();
	if (data.data.length===0) {
		return {
			code: 300,
			msg: "数据不存在！",
			data: '',
		}
	}
	let data_res = data.data[0]
	console.log(data_res);
	data_res.db = 'base-list'
	if (userInfo._id != data_res.creator_id) {
		return {
			code: 500,
			msg: "删除失败！",
			data: '',
		}
	}
	await db.collection('recycle-bin').add(data_res)
	// 删除操作
	let res = await collection.doc(event.id).remove();
	if (res.deleted === 1) {
		uniCloud.deleteFile({
			fileList: [data_res.qrcode]
		})
		return {
			code: 200,
			msg: "删除成功！",
			data: '',
		}
	} else {
		return {
			code: 500,
			msg: "删除失败！"
		}
	}
}
// 改
async function edit(event) {
	let {
		id,
		name,
		phone,
		address
	} = event
	const collection = db.collection('base-list')
	let res = await collection.doc(id).update({
		name,
		phone,
		address
	})
	return {
		code: 200,
		msg: '修改成功!',
	}
}
// 查
async function list(event) {
	let limit = event.limit ? event.limit : 15
	let page = event.page ? event.page - 1 < 0 ? 0 : event.page - 1 : 0
	let start = page * limit
	const collection = db.collection('base-list')
	let res = await collection.skip(start).limit(limit).orderBy('create_time', 'desc').get()
	let total = await collection.count()
	let result = res.data
	return {
		code: 200,
		msg: "请求成功",
		total: total.total,
		data: result
	}
}

// 查单条详情
async function detail(event) {
	const {
		id
	} = event
	try {
		const collection = db.collection('base-list')
		const res = await collection.where({
			_id: id,
		}).get()
		if (res.data.length == 0) {
			return {
				code: 300,
				msg: "未查找到相关数据",
				data: ''
			}
		} else {
			return {
				code: 200,
				msg: "请求成功",
				data: res.data[0]
			}
		}
	} catch (e) {
		return {
			code: 500,
			msg: "参数错误",
		}
	}

}