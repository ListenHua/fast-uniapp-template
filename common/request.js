export default class {

	constructor() {
		this.config = {
			showLoading: true,
			delayed: 1000,
			beforeRequest: null,
			afterRequest: null,
			isLogin: false,
		}

		this.network = {
			isLogin: false,
			running: false,
			refresh: false,
			paddingList: [],
			requestList: []
		}
	}

	/**
	 * 微信登录
	 */
	async _login() {
		return new Promise((resolve, reject) => {

			if (!uni.getStorageSync('userInfo')) {
				this.network.isLogin = false;
			}

			if (this.network.isLogin) {
				resolve()
			} else if (this.network.running) {
				reject();
			} else {
				this.network.running = true;
				const _this = this;
				uni.login({
					success: result => {
						uniCloud.callFunction({
								name: 'user',
								data: {
									action: "login",
									params: {
										code: result.code
									}
								}
							}).then(res => {
								uni.setStorageSync('token', res.result.data.token)
								uni.setStorageSync('userInfo', res.result.data.userInfo)
								_this.network.isLogin = true;
								this.network.running = false;
								resolve()
							})
							.catch(res => {
								_this._showError('客户端授权失败');
								this.network.running = false;
							})
					}
				})
			}
		})
	}

	/**
	 * 刷新 TOKEN
	 */
	async _refresh() {
		return new Promise((resolve, reject) => {
			if (!this.network.refresh) {
				resolve();
			} else {
				this.network.refresh = true;
				const _this = this;
				uni.login({
					success: data => {
						uniCloud.callFunction({
								name: 'user',
								data: {
									action: "login",
									params: {
										code: data.code
									}
								}
							}).then(res => {
								uni.setStorageSync('token', res.result.data.token)
								uni.setStorageSync('userInfo', res.result.data.userInfo)
								_this.network.isLogin = true;
								this.network.refresh = false;
								resolve()
							})
							.catch(res => {
								_this._showError('客户端授权失败');
								this.network.running = false;
							})
					}
				})
			}
		})
	}
	request(api, params) {
		return new Promise(async (resolve, reject) => {
			// 1.将请求压入等待队列
			this.network.paddingList.push({
				api,
				params,
				resolve,
				reject
			})

			// 2.判断是否登录 
			await this._login();
			// 3.登录成功后 发送所有阻塞的请求
			while (this.network.paddingList.length > 0) {
				const request = this.network.paddingList.shift();
				if (this.network.refresh) {
					this.network.requestList.push(request);
				} else {
					await this._sendRequest(request.api, request.params)
						.then(data => {
							request.resolve(data);
						}).catch(async data => {
							// TOKEN 需要刷新
							if (data.code == 402 || data.code == 401) {
								this.network.refresh = true;
								// 将需要刷新的接口压入等待队列
								this.network.requestList.push(request);
								await this._refresh()
								this.network.refresh = false;
								while (this.network.requestList
									.length > 0) {
									const retry = this.network.requestList.shift();
									const reData = await this._sendRequest(retry.api, retry
										.params);
									retry.resolve(reData);
								}
							} else {
								reject(data)
							}
						});
				}
			}
		})
	}

	async _sendRequest(api, params = {}, method = 'GET') {
		params.token = uni.getStorageSync('token')
		let base_url = api.split('/')
		if (!base_url && base_url.length != 2) {
			return {
				code: 500,
				message: '请输入正确的url'
			}
		}
		return new Promise((resolve, reject) => {
			// if (Runtime.user.isLogin) {
			//     Config.requestInterceptor().catch(() => { reject() });
			// }
			let delayedFlag = true;
			const _this = this;
			uniCloud.callFunction({
				name: base_url[0],
				data: {
					action: base_url[1],
					params,
				}
			}).then(res => {
				let data = res.result
				switch (data.code) {
					// 正常返回
					case 200:
						resolve(data);
						break;
					case 300:
						_this._showError(data.msg, () => {});
						reject(data);
						break;
						// 无效 token
					case 401:
						reject(data);
						break;
						// 过期
					case 402:
						reject(data);
						break;
					case 500:
						_this._showError(data.msg, () => {});
						reject(data);
						break;
					default:
						reject(data);
						break;

				}

			}).catch(res => {
				uni.showToast({
					title: '服务器连接失败',
					icon: 'none',
					duration: 2000
				});
				reject();
			})
		})
	}

	// 重置网络请求状态
	clearRequest() {
		if (uni.$runtime.network.running || uni.$runtime.user.running) {
			uni.$runtime.network.requestList = [];
			uni.$runtime.network.running = false;
			uni.$runtime.user.running = false;
		}
	}

	_showError(message, callback = () => {}, duration = 2000) {
		uni.showToast({
			title: message,
			icon: 'none',
			duration: duration,
			// success() {
			// 	callback();
			// }
		});
	}
}
