<template>
	<view class="content">
		<view class="list">
			<view class="item" v-for="item in list">
				<image :src="item.qrcode" @click="viewQrcode(item)"></image>
				<view class="item-info" @click="viewDetail(item)">
					<view>{{item.name}}</view>
					<view>{{item.phone}}</view>
					<view>{{item.address}}</view>
				</view>
			</view>
		</view>
		<u-empty v-if="nodata" mode="data" icon="http://cdn.uviewui.com/uview/empty/data.png">
		</u-empty>
		<view class="float-button" @click="inputShow=true">
			<u-icon name="plus" color="#fff" size="20"></u-icon>
		</view>
		<u-popup :show="qrcodeShow" mode="center" round="20" :safeAreaInsetBottom='false' @close="qrcodeShow=false">
			<view>
				<image class="qrcode-image" :src="qrcodeUrl"></image>
			</view>
		</u-popup>
		<u-popup :show="inputShow" mode="center" round="20" closeable safeAreaInsetTop @close="inputShow=false">
			<view class="input-content">
				<u--form labelPosition="left" :model="formState" :rules="formRules" ref="form1">
					<u-form-item label="姓名" prop="userInfo.name" borderBottom ref="item1">
						<u--input v-model="formState.userInfo.name" border="none"></u--input>
					</u-form-item>
					<u-form-item label="手机" prop="userInfo.phone" borderBottom ref="item1">
						<u--input v-model="formState.userInfo.phone" border="none"></u--input>
					</u-form-item>
					<u-form-item label="住址" prop="userInfo.address" borderBottom ref="item1">
						<u--textarea v-model="formState.userInfo.address" count border="none"></u--textarea>
					</u-form-item>
				</u--form>
				<u-button type="primary" @click="createInfo">提交</u-button>
			</view>
		</u-popup>
	</view>
</template>

<script setup>
	import {
		getCurrentInstance,
		ref,
		reactive
	} from 'vue'
	import {
		onReachBottom,
		onLoad
	} from '@dcloudio/uni-app'
	const {
		proxy
	} = getCurrentInstance()
	const list = reactive([])
	const qrcodeShow = ref(false)
	const inputShow = ref(false)
	const qrcodeUrl = ref('')
	const formState = reactive({
		userInfo: {
			name: '',
			phone: '',
			address: '',
		},
	})
	const formRules = reactive({
		'userInfo.name': {
			type: 'string',
			required: true,
			message: '请填写姓名',
			trigger: ['blur', 'change']
		},
		'userInfo.phone': {
			type: 'number',
			required: true,
			message: '请输入手机号',
			trigger: ['blur', 'change']
		},
		'userInfo.address': {
			type: 'string',
			required: true,
			message: '请输入住址',
			trigger: ['blur', 'change']
		},
	})
	const listParams = reactive({
		page: 1,
		params: 15
	})
	const nodata = ref(false)
	onReachBottom((e) => {
		getList()
	})
	onLoad(() => {
		getList()
	})
	uni.$on('refresh-base', () => {
		console.log("执行");
		init()
	})
	const init = () => {
		listParams.page = 1
		list.length = 0
		nodata.value = false
		formState.userInfo = {
			name: '',
			phone: '',
			address: '',
		}
		getList()
	}
	const getList = async () => {
		uni.showLoading({
			title: '加载中...'
		})
		try {
			const res = await proxy.$http.request('base/list', listParams)
			res.data.forEach(item => {
				list.push(item)
			})
			if (res.data.length === 0 && listParams.page === 1) {
				nodata.value = true
			}
		} catch (error) {
			console.log(error);
		} finally {
			uni.hideLoading()
		}
	}
	const createInfo = async () => {
		uni.showLoading({
			title: '正在提交...'
		})
		try {
			const res = await proxy.$http.request('base/add', formState.userInfo)
			uni.showToast({
				title: res.msg
			})
			inputShow.value = false
			init()
		} catch (error) {
			uni.showToast({
				title: error.msg || "添加失败"
			})
		}
	}
	const viewQrcode = (data) => {
		qrcodeShow.value = true
		qrcodeUrl.value = data.qrcode
	}
	const viewDetail = (data) => {
		uni.navigateTo({
			url: `/pages/index/detail?id=${data._id}`
		})
	}
</script>

<style lang="scss" scoped>
	.list {
		padding: 0 40rpx 80rpx;

		.item {
			width: 100%;
			display: flex;
			border-bottom: 2rpx solid #f1f1f1;
			padding: 30rpx 0;

			&-info {
				margin-left: 40rpx;
				flex: 1;

				view {
					margin-bottom: 10rpx;

					&:first-child {
						font-size: 36rpx;
						font-weight: bold;
					}

					&:nth-child(3) {
						color: #8a8a8a;
						margin-bottom: 0;
					}
				}
			}

			image {
				width: 80rpx;
				height: 80rpx;
				flex-shrink: 0;
			}
		}
	}

	.qrcode-image {
		width: 400rpx;
		height: 400rpx;
		border-radius: 40rpx;
	}

	.float-button {
		position: fixed;
		bottom: 100rpx;
		right: 40rpx;
		z-index: 9;
		background-color: #419EFF;
		border-radius: 50%;
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.input-content {
		width: 80vw;
		padding: 0 60rpx;
		box-sizing: border-box;
	}
</style>