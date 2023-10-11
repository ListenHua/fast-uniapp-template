# Fast-uniapp-template

## 介绍

该项目主要用于快速搭建uniapp带uniCloud的项目，做好增删改查的基础云函数预设

## 技术

uniapp vue3+js+uview-plus

## 搭建步骤
1. clone项目下来
2. 打开云服务[uniCloud](https://mp.weixin.qq.com/wxopen/waregister?action=step1&source=mpregister&token=&lang=zh_CN) 创建云空间（已创建的请忽略）
3. 修改云函数文件`/wx-common/`下的`index.js`文件中的`appid`与`appSecret`
4. 关联云空间，安装依赖，运行