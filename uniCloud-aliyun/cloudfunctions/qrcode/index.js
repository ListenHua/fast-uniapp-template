'use strict';
const {
	getAccessToken,
	appId,
	appSecret
} = require("wx-common");
const db = uniCloud.database()
exports.main = async (event, context) => {
	const {
		action,
		params
	} = event
	switch (action) {
		case 'create': {
			return create(params)
		}
		default: {
			return
		}
	}
};

async function create(event) {
	let timestamp = event.time
	const collection = db.collection('server-cache')
	let serverAccess = (await collection.where({
		type: "accessToken"
	}).get()).data[0]
	console.log('serverAccess', serverAccess);
	if (!serverAccess) {
		serverAccess = {
			type: "accessToken",
			time: timestamp,
			accessToken: "",
		}
		collection.add(serverAccess)
	}
	let accessToken;
	if (serverAccess.time - 10000 < timestamp) {
		let access = await uniCloud.httpclient.request(
			`https://api.weixin.qq.com/cgi-bin/token?appid=${appId}&secret=${appSecret}&grant_type=client_credential`, {
				dataType: "json"
			}
		)
		accessToken = access.data.access_token
		if (serverAccess.id) {
			collection.doc(serverAccess.id).update({
				time: timestamp,
				accessToken,
			})
		}
	} else {
		accessToken = serverAccess.accessToken
	}
	let params = {
		"page": event.path,
		"scene": event.scene,
		"check_path": false,
		"env_version": "release"
		// "env_version": "trial"
	}
	const wxdata = await uniCloud.httpclient.request(
		`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`, {
			method: "POST",
			data: JSON.stringify(params),
		}
	)
	let image = await uniCloud.uploadFile({
		cloudPath: 'qrcode' + timestamp + '.jpg',
		fileContent: wxdata.data
	})
	return image.fileID
}