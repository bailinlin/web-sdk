# 前端数据采集埋点 SDK 使用指南

DCP 是用来采集用户行为数据的一个脚本，所以你需要将脚本通过 `script` 来引入到你的项目中去，引入方式入下

```
<script>
	(function() {
		var collect = document.createElement('script');
		collect.type = 'text/javascript';
		collect.async = true;
		collect.src =  'http://collect.trc.com/index.js';
		var s = document.getElementsByTagName('script')[0];
		s.parentNode.insertBefore(collect, s);
	})();

		var _XT = []; //定义信息配置对象

  	    _XT.push(['Target','div']); //无埋点行为采集
		_XT.push(['auth','93c55350e179a3676c905723e112b440']); //处于安全性考虑的传参

		// 用户自定义收集字段,现在传的是接入方的渠道码
		_XT.userConfig = {
			dcpChannelCode: 've3dC41i' 
		};
</script>
```

1. 我们的  sdk 部署在 `http://collect.trc.com/index.js`  上，通过异步方式加载到你的项目中
2. 定义采集配置对象 _XT 
3. Target 是无埋点采集行为的配置对象，可以采集配置的 html 元素的所有的点击事件，考虑流量问题，需要慎用，如果不进行无埋点采集，可以不添加 Target 配置
4. auth 是处于安全性的传参，服务器会根据一种复杂的逻辑算法判断是否是内部采集的项目，防止恶意流量注入，新对接的同学请找 霸天 同学要下传参值，电商 auth ：93c55350e179a3676c905723e112b440
5. dcpChannelCode 用于区分接入渠道的渠道码，电商的渠道码：ve3dC41i

### 使用 SDK 方法

> sdk.dispatch('customEvent',customerEventDOM,extraInfo)

dispatch 是 SDK 暴露出来的自定义事件采集方法，参数介绍如下

1. customEvent，字符串，自定义事件名称，需要采集放和 dmp 进行约定，解析成报表的时候会用到
2. customerEventDOM ，dom 元素，用来采集 sdk 触发的节点，`customerEventDOM = document.getElementById('customer-event')`
3. extraInfo ，对象，用来传业务采集定制扩展的数据，接入时需要与 dmp 约定好， 电商采集的信息 extraInfo 格式如下

```
ExtroInfo：{
type：ds-gwc,        // 唯一 不同接入方 使用不同的前缀  这里表示：电商-购物车
goodsId：xxxx        // 商品id
skuId: xxx           //商品规格id
goodsCounts: xxx     //加入购物车件数
httpCode: 200 500 …,   //httpcode
serviceCode:  xxx，     //业务code          
message：'记录操作结果，成功或发生错误记录错误类型'，
}    
```

> sdk.storeUserId(userId)

storeUserId 是 SDK 暴露出的存储 userId 的方法，根据采集时间是否发送 userId ，区分是游客身份还是用户身份参数介绍如下

1. userId ，用户登录，业务接口返回的 userId



### 对接联调

#### 对接

为了统一各个环境的代码，项目内通讯使用的是域名通讯，对接的时候请在自己的电脑上配置 域名映射，具体配置如下：

```
10.50.1.30  collect.trc.com
10.50.1.30  collectiframe.trc.com
```

#### 联调

嵌入采集脚本之后，会默认调用`isupload`接口来判断是否采集页面加载及页面间的跳转信息，接入方接入之后可以通过查看浏览器的 Debug 工具 Network 看请求是否正常发送

1. isUpload 接口 : http://collect.trc.com/rest/collect/isupload/app/v1/?dcpChannelCode=ve3dC41i&device=3&random=0.49842804159284904
2. isUpload 没有返回内容，是否采集事件根据 isUpload 的 http 状态码进行判断，403 表示不采集，其他 code 默认采集 

如果 isUpload 判断采集页面加载及页面跳转信息，sdk 会继续发送事件

1.  设备信息采集接口：http://collect.trc.com/rest/collect/device/h5/v1/?dcpChannelCode=ve3dC41i 

   设备信息采集接口参数结构如下：

   ```
   DeviceType:"web"
   Language:"zh-CN"
   ScreenHigh:1080
   ScreenWide:1920
   ```

   ​

2.  事件采集接口：http://collect.trc.com/rest/collect/event/h5/v1/?dcpChannelCode=ve3dC41i 

    a. 页面加载发送 `beforeload` 和`loaded` 事件

    b. 页面离开发送 `unload` 事件

   c.  单页面应用及页面内连接跳转发送`unload`和`insideloaded`事

   ```
   {
       "ExtraInfo": {},
       "Event": "beforeload",
       "CurrentTime": 1525847430075,
       "PageTitle": "SDK测试问题记录",
       "PageSessionID": "2c3fca2bc38aa95f3d0877b824eee00a",
       "appSessionId": "8ddcb8cc1739a4a20c27bbcfeec3e9f9"
   }
   ```

   ​


3. 自定义事件会在调用`dispatch`方法的时候发送一个事件,参数示例如下

   ```
   {
       "ExtraInfo": {
           type：ds-gwc,        // 唯一 不同接入方 使用不同的前缀  这里表示：电商-购物车
           goodsId：xxxx        // 商品id
   		skuId: xxx           //商品规格id
   		goodsCounts: xxx     //加入购物车件数
   		httpCode: 200 500 …,   //httpcode
   		serviceCode:  xxx，     //业务code          
   		message：'记录操作结果，成功或发生错误记录错误类型'，
       },
       "Event": "click",
       "CurrentTime": 1525847250344,
       "PageTitle": "篮球0001",
       "PageSessionID": "8ddcb8cc1739a4a20c27bbcfeec3e9f9",
       "appSessionId": "2c3fca2bc38aa95f3d0877b824eee00a"
   }
   ```
## DCP 项目部署checkList

前端项目地址： 

    	git@rep.360taihe.com:dcp/web-sdk.git   // git 协议地址
    
    	https://rep.360taihe.com/dcp/web-sdk   // http 协议地址



前端 nginx 配置，2个配置文件 

1. collect.trc.com

    	server {
        listen 80;
        server_name collect.trc.com;   //线上测试都部署这个域名，不可变
    	
        location / {
          root    /users/dtx/Documents/newWorkSpace/web-sdk;
          index  index.html index.htm;
        }
    
        location ^~ /rest/collect/ {
    	#proxy_pass  http://10.200.4.124:10000/rest/collect/;
    	proxy_pass  http://10.200.143.21:10000/rest/collect/;
        }    
      }

1. collectiframe.trc.com

    server {
        listen 80;
        server_name collectiframe.trc.com;
    
        location / {
          root    /users/dtx/Documents/newWorkSpace/web-sdk;
          index  deviceId.html deviceId.htm;
        }
      
      }

注意事项，这两个 nginx 配置指向的文件目录相同，index 指向文件不同，部署启动之后请访问域名，collectiframe.trc.com 和 collect.trc.com 确保项目启动成功

   ​

