<template>
	<view>
		<view class="content">
			<view>{{info.name}}</view>
			<view>{{info.phone}}</view>
			<view>{{info.address}}</view>
			<image :src="info.qrcode" mode="aspectFill"></image>
			<u-button type="primary" :customStyle="{marginTop:'100rpx'}" @click="showEdit">编辑</u-button>
			<u-button type="error" :customStyle="{marginTop:'30rpx'}" @click="removeInfo">删除</u-button>
		</view>

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
				<u-button type="primary" @click="editInfo">确认修改</u-button>
			</view>
		</u-popup>
	</view>
</template>

<script setup>
	import {
		onLoad
	}
	from '@dcloudio/uni-app'
	import {
		getCurrentInstance,
		ref,
		reactive
	} from 'vue'
	const {
		proxy
	} = getCurrentInstance()
	onLoad((options) => {
		console.log(options);
		queryInfo(options.id)
	})
	const info = ref({})
	const inputShow = ref(false)
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
	const showEdit = () => {
		const {
			name,
			phone,
			address
		} = info.value
		formState.userInfo.name = name
		formState.userInfo.phone = phone
		formState.userInfo.address = address
		inputShow.value = true
	}
	const editInfo = async () => {
		let params = {
			id: info.value._id,
			name: formState.userInfo.name,
			phone: formState.userInfo.phone,
			address: formState.userInfo.address
		}
		try {
			const res = await proxy.$http.request('base/edit', params)
			uni.showToast({
				title: res.msg
			})
			queryInfo(info.value._id)
			inputShow.value = false
		}catch(error){
			console.log(error);
		}
	}
	const removeInfo = () => {
		try {
			uni.showModal({
				title: "删除提示",
				content: "确定要删除本条信息吗？",
				success: async (res) => {
					if (res.confirm) {
						const {
							msg
						} = await proxy.$http.request('base/remove', {
							id: info.value._id
						})
						uni.showToast({
							title: msg,
							mask: true,
							duration: 1500
						})
						uni.$emit('refresh-base')
						setTimeout(() => {
							uni.navigateBack()
						}, 1500)
					}
				}
			})
		} catch (error) {
			uni.showToast({
				icon: 'none',
				title: error.msg
			})
		}
	}
	const queryInfo = async (id) => {
		uni.showLoading({
			title: '加载中...'
		})
		try {
			const {
				data
			} = await proxy.$http.request('base/detail', {
				id
			})
			info.value = data
		} catch (error) {
			uni.showToast({
				icon: 'none',
				title: error.msg
			})
		} finally {
			uni.hideLoading()
		}
	}
</script>

<style lang="scss">
	.content {
		padding: 80rpx;
		display: flex;
		flex-direction: column;
		align-items: center;

		view {
			margin-bottom: 40rpx;

			&:first-child {
				font-size: 50rpx;
				font-weight: bold;
			}

			&:nth-child(2) {
				font-size: 36rpx;
			}

		}

		image {
			margin-top: 100rpx;
			width: 400rpx;
			height: 400rpx;
		}
	}

	.input-content {
		width: 80vw;
		padding: 0 60rpx;
		box-sizing: border-box;
	}
</style>