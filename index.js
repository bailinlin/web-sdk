var sdk = (function(root) {
		'use strict';

		//扩展帮助方法*/
		var helper = {};

		// 唯一标示 uuid,pageSessionId
		helper.uuid = function() {
				return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
						var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
						return v.toString(16);
				});
		};

		//遍历
		/**
		 * @method each
		 * @parame loopable 要遍历的对象
		 * @parame callback 回调函数
		 * @parame self 上下文
		 **/
		helper.each = function(loopable, callback, self) {
				var additionalArgs = Array.prototype.slice.call(arguments,3);
				if(loopable) {
						if(loopable.length === +loopable.length) {
								for(var i=0; i<loopable.length; i++) {
										callback.apply(self, [loopable[i],i].concat(additionalArgs));
								}
						} else {
								for(var item in loopable) {
										callback.apply(self, [loopable[item], item].concat(additionalArgs));
								}
						}
				}
		};

		//扩展
		/**
		 *@method extend
		 *@parame base 要扩展的对象
		 *@return base  返回扩展后的对象
		 **/
		helper.extend = function(base) {
				helper.each(Array.prototype.slice.call(arguments, 1), function(extensionObject) {
						helper.each(extensionObject, function(value, key) {
								if(extensionObject.hasOwnPrototype(key)) {
										base[key] = value;
								}
						});
				});
				return base;
		};

		//返回数组元素所在的位置，确定是否包含在里面
		/**
		 *@method indexOf
		 *@parame arrayToSearch 查找的对象
		 *@parame item 查找的元素
		 *@return args  返回位置
		 **/
		helper.indexOf = function(arrayToSearch,item){
				if(Array.prototype.indexOf){
						return arrayToSearch.indexOf(item);
				} else {
						for(var i=0; i< arrayToSearch.length; i++){
								if(arrayToSearch[i] === item) return i;
						}
						return -1;
				}
		};

		//绑定事件
		helper.on = function(target, type, handler) {
				if(target.addEventListener) {
						target.addEventListener(type, handler, false);
				} else {
						target.attachEvent("on" + type,
								function(event) {
										return handler.call(target, event);
								}, false);
				}
		};

		//取消事件监听
		helper.remove = function(target, type, handler) {
				if(target.removeEventListener) {
						target.removeEventListener(type, handler);
				} else {
						target.detachEvent("on" + type,
								function(event) {
										return handler.call(target, event);
								}, true);
				}
		};

		//将json转为字符串
		helper.changeJSON2Query =  function (jsonObj) {
				var args = '';
				for (var i in jsonObj) {
						if (args != '') {
								args += '&';
						}
						args += i + '=' + encodeURIComponent(jsonObj[i]);
				}
				return args;
		};

		//将相对路径解析成文档全路径
		helper.normalize = function (url){
				var a=document.createElement('a');
				a.setAttribute('href',url)
				return a.href;
		}

		//拷贝元素
		helper.copyObj = function (copyObj) {
				var obj = {};
				for ( var i in copyObj) {
						obj[i] = copyObj[i];
				}
				return obj;
		}

		//初始化采集对象
		var collect = {
				deviceUrl:'//collect.xxx.com/rest/collect/device/h5/v1',
				eventUrl:'//collect.xxx.com/rest/collect/event/h5/v1',
				isuploadUrl:'//collect.xxx.com/rest/collect/isupload/app/v1',
				parmas:{ ExtraInfo:{} },
				device:{}
		};


		//设置设备信息
		collect.setDevice = function () {
				if(window && window.screen) {
						this.device.ScreenHigh = window.screen.height || 0;
						this.device.ScreenWide = window.screen.width || 0;
						this.device.DeviceType = 'web';
				}
				if (navigator) {
						this.device.Language = navigator.language || '';
				}
		}

		collect.updatePageInfo = function(){
				if(document) {
						this.sourceUrl =  this.origin || document.referrer || '';
						this.currentUrl =  this.current || document.URL || '';
						this.parmas.PageTitle = document.title || '';
				}
		}

		//设置跟新参数
		collect.setParames = function() {

				collect.updatePageInfo()

				//解析 配置项
				if(typeof _XT != "undefined") {
						if(_XT.userConfig.dcpChannelCode){

								collect.deviceUrl =collect.deviceUrl.split('/?')[0] +'/?dcpChannelCode='+_XT.userConfig.dcpChannelCode
								collect.eventUrl = collect.eventUrl.split('/?')[0] +'/?dcpChannelCode='+_XT.userConfig.dcpChannelCode
								collect.isuploadUrl = collect.isuploadUrl.split('/?')[0] +'/?dcpChannelCode='+_XT.userConfig.dcpChannelCode
						}

						for(var i in _XT) {
								switch(_XT[i][0]) {
										case 'Target':
												collect.target = _XT[i].slice(1);
												break;
										case 'deviceUrl':
												if(_XT.userConfig){
														collect.deviceUrl = _XT[i][1].split('/?')[0] +'/?dcpChannelCode='+_XT.userConfig.dcpChannelCode
												}else {
														collect.deviceUrl = _XT[i][1];
												}
												break;
										case 'eventUrl':
												if(_XT.userConfig){
														collect.eventUrl = _XT[i][1].split('/?')[0] +'/?dcpChannelCode='+_XT.userConfig.dcpChannelCode
												}else {
														collect.eventUrl = _XT[i][1];
												}
												break;
										case 'isuploadUrl':
												if(_XT.userConfig){
														collect.eventUrl = _XT[i][1].split('/?')[0] +'/?dcpChannelCode='+_XT.userConfig.dcpChannelCode
												}else {
														collect.eventUrl = _XT[i][1];
												}
												break;
										default:
												break;
								}
						}
						if(_XT.syserror && _XT.syserror.length) {
								this.parmas.syserror = _XT.syserror;
								_XT.syserror = [];
						} else {
								delete this.parmas.syserror;
						}
				} else {
						throw "必须定义全局配置变量 _XT，配置指定的请求Url。示例： var _XT = []";
				}
		};

		//获取事件参数
		collect.getParames = function() {
				return this.parmas;
		};

		//获取设备信息
		collect.getDevice = function() {
				return this.device;
		};

		//请求，保存数据
		collect.send = function(obj) {

				obj.PageSessionID = sessionStorage.getItem('PageSessionID')

				if (window.XMLHttpRequest) {
						var xhr = new XMLHttpRequest();
				}
				else {
						var xhr = new ActiveXObject("Microsoft.XMLHTTP");
				}

				xhr.open('POST',collect.eventUrl)
				xhr.setRequestHeader('X-Device-Id', collect.deviceId)
				xhr.setRequestHeader('Content-Type', 'application/json')

				xhr.setRequestHeader('X-Source-Url', encodeURI(collect.sourceUrl))
				xhr.setRequestHeader('X-Current-Url', encodeURI(collect.currentUrl))
				xhr.setRequestHeader('X-User-Id',sessionStorage.getItem('userId')||' ') //混合应用，可能会变
				xhr.withCredentials = false;

				xhr.send(JSON.stringify(obj))
		};

		//请求，存储设备信息
		collect.sendDevice = function(obj, url) {
				if (window.XMLHttpRequest) {
						var xhr = new XMLHttpRequest();
				}
				else {
						var xhr = new ActiveXObject("Microsoft.XMLHTTP");
				}

				xhr.open('POST',url)
				xhr.setRequestHeader('X-Device-Id', collect.deviceId)
				xhr.withCredentials = false


				xhr.send(JSON.stringify(obj))

		};

		//请求，判断是否采集信息
		collect.isupload = function(url) {
				if (window.XMLHttpRequest) {
						var xhr = new XMLHttpRequest();
				}
				else {
						var xhr = new ActiveXObject("Microsoft.XMLHTTP");
				}

				xhr.onreadystatechange = function() {//服务器返回值的处理函数，此处使用匿名函数进行实现
						if(xhr.readyState == 4){
								if( xhr.status == 403){
										// 考虑存储好 userId ，用户登录好的情况，如果已经进行事件采集，则取消事件监听
										collect.openCollect = false
										helper.remove(window,'popstate', collect.onPopStateHandler)
										helper.remove(window,'beforeunload', collect.beforeUnloadHandler)
										collect.onPushStateHandler = function () {
												return false
										}
								}else {
										if(!collect.loadEventSend){
												collect.loadEventSend = 'collected'
												collect.openCollect = true
												collect.setDevice();
												if(!collect.dcpDeviceType){
														collect.setIframe()
												}else {
														collect.saveEvent(JSON.stringify(collect.beforeload))
														setTimeout(function () {
																collect.saveEvent(JSON.stringify(collect.loaded))
														},1000)
												}
												collect.event()
										}
								}
						}
				};

				var obj = {
						device:3
				}

				var url =  url +'&'+ helper.changeJSON2Query(obj)+ '&random=' +Math.random();
				xhr.open('GET',url)
				xhr.setRequestHeader('X-User-Id', sessionStorage.getItem('userId')?sessionStorage.getItem('userId'):' ')

				xhr.withCredentials = false;
				xhr.send()



		};

		//点击事件的回调方法
		collect.clickHandler =function (e) {
				var that = collect
				that.parmas && that.parmas.PageElement && delete that.parmas.PageElement
				var $target = e.target || e.srcElement;

				var currtagName = $target.nodeName.toLowerCase();
				if(currtagName == "body" || currtagName == "html" || currtagName == "") {
						return 0;
				}
				if(that.openCollect == true && (that.target && helper.indexOf(that.target, currtagName) > -1 || $target.getAttribute('collect'))) {

						that.parmas.PageElement = '{nodeName:'+$target.nodeName +
								',title:' + $target.title + ',text:' +$target.innerHTML + '}';

						that.parmas.Event = 'click'
						that.setParames();
						that.parmas.CurrentTime = new Date().getTime()
						that.saveEventInfo()
				}
		}

		//beforeunload 事件的回调方法
		collect.beforeUnloadHandler = function(){
				collect.parmas.Event = 'unload'
				if(collect.parmas && collect.parmas.CurrentTime && (new Date().getTime()-collect.parmas.CurrentTime) > 100){
						collect.parmas.CurrentTime = new Date().getTime()
						collect.setParames();
						collect.saveEventInfo()
				}

		}

		//onpopstate 事件回调函数
		collect.onPopStateHandler = function () {
				if(collect.loadEventSend){
						if(collect.parmas && collect.parmas.CurrentTime && (new Date().getTime()-collect.parmas.CurrentTime) > 100){

								if(typeof Promise == 'function'){
										var runAsync = function(){
												var p = new Promise(function(resolve, reject){
														collect.parmas.Event = 'unload'
														collect.parmas.CurrentTime = new Date().getTime()
														collect.current = collect.origin
														collect.setParames();
														collect.saveEventInfo()
														resolve()
												});
												return p;
										}
										runAsync().then(function () {
												collect.parmas.Event = 'insideload'
												sessionStorage.setItem('PageSessionID',helper.uuid())
												collect.current = document.URL
												collect.setParames();
												collect.saveEventInfo()

												collect.origin = document.URL
										})
								}else {
										//TODO 全局清理 unload 自定义事件传入的参数，在发其他请求的时候不发
										collect.parmas.Event = 'unload'
										collect.parmas.CurrentTime = new Date().getTime()
										collect.current = collect.origin
										collect.setParames();
										collect.saveEventInfo()

										setTimeout(function () {
												collect.parmas.Event = 'insideload'
												sessionStorage.setItem('PageSessionID',helper.uuid())
												collect.current = document.URL
												collect.setParames();
												collect.saveEventInfo()

												collect.origin = document.URL
										},1000)
								}
						}
				}
		}

		//onpushstate 事件回调
		collect.onPushStateHandler = function (_state) {
				if(collect.loadEventSend){
						if(collect.parmas && collect.parmas.CurrentTime && (new Date().getTime()-collect.parmas.CurrentTime) > 100){
								collect.parmas.Event = 'unload'
								collect.parmas.CurrentTime = new Date().getTime()
								collect.setParames();
								collect.saveEventInfo()

								setTimeout(function () {
										collect.parmas.Event = 'insideload'
										sessionStorage.setItem('PageSessionID',helper.uuid())
										collect.current = helper.normalize(_state.url)
										collect.setParames();
										collect.saveEventInfo()

										collect.origin = document.URL
								},1000)
						}
				}

		}

		//系统级事件初始化
		collect.event = function() {
				var clickEvent = ['click']
				for(var j=0;j<clickEvent.length;j++){
						helper.on(document.body, clickEvent[j], collect.clickHandler);
				}
				//监听页面，用户退出离开的时候触发事件
				helper.on(window,'beforeunload', collect.beforeUnloadHandler)

				//当页面应用，路由切换触发事件
				helper.on(window,'popstate', collect.onPopStateHandler)
		}

		//存储加载完成和开始加载数据信息
		collect.getBeforeload=function() {
				collect.parmas.Event = 'beforeload'
				collect.parmas.CurrentTime = new Date().getTime()
				collect.setParames();
				collect.beforeload = helper.copyObj(collect.getParames())
		}

		//存储加载完成，获取设备类型，记录加载完成信息
		collect.onload = function() {
				if(document.cookie){
						var cookieArr = document.cookie.split('; ')
						for(var i=0;i<cookieArr.length;i++){
								if(cookieArr[i].indexOf('dcp_device_type')>-1){
										collect.dcpDeviceType = cookieArr[i].split('=')[1]
								}
						}
				}

				collect.isloaded = true
				collect.parmas.Event = 'loaded'
				collect.parmas.CurrentTime = new Date().getTime()
				collect.setParames();
				collect.loaded = helper.copyObj(collect.getParames())
				collect.origin = document.URL
				collect.isupload(collect.isuploadUrl)

		}

		//web 应用，通过嵌入 iframe 进行跨域 cookie 通讯，设置设备id,
		collect.setIframe = function () {
				var that = this
				var iframe = document.createElement('iframe')
				iframe.id = "frame",
						iframe.src = '//collectiframe.xxx.com'
				iframe.style.display='none'
				document.body.appendChild(iframe)

				iframe.onload = function () {
						iframe.contentWindow.postMessage('loaded','*');
				}

				//监听message事件
				helper.on(window,"message",function(event){
						console.log('监听message事n setIframe',event)
						that.deviceId = that.deviceId ? that.deviceId : event.data

						if(event.data){
								that.sendDevice(that.getDevice(), that.deviceUrl);
								setTimeout(function () {
										that.send(that.beforeload)
										that.send(that.loaded)
								},1000)
						}
				})
		}

		// app 与 h5 混合应用，直接将数信息发给 app
		collect.saveEvent = function (jsonString) {

				collect.dcpDeviceType && setTimeout(function () {
						if(collect.dcpDeviceType=='android'){
								android.saveEvent(jsonString)
						} else {
								window.webkit && window.webkit.messageHandlers ? window.webkit.messageHandlers.nativeBridge.postMessage(jsonString) : window.postBridgeMessage(jsonString)
						}

				},1000)
		}

		//采集自定义事件类型
		collect.dispatch = function(eType,element,extraInfo){

				var that = collect;

				element && helper.remove(element,'click',that.clickHandler)

				if(that.openCollect){
						if(element){
								var $target = element
								that.parmas.PageElement = '{nodeName:'+$target.nodeName +
										',title:' + $target.title + ',text:' +$target.innerHTML + '}';
						}

						that.parmas.Event = eType
						that.parmas.CurrentTime = new Date().getTime()
						that.setParames();
						that.parmas.ExtraInfo = extraInfo
						that.saveEventInfo()
				}

		}

		//将参数 userId 存入sessionStorage
		collect.storeUserId = function (_userId) {
				sessionStorage.setItem('userId',_userId)
				// 调用 isupload
				collect.isupload(collect.isuploadUrl)
		}

		//采集H5信息,如果是混合应用，将采集到的信息发送给 app 端
		collect.saveEventInfo = function () {

				var that = this
				var _obj = that.getParames()

				if(collect.dcpDeviceType){
						that.saveEvent(JSON.stringify(_obj))
				}else {
						that.send(_obj)
				}
		}

		collect.init = function() {

				sessionStorage.setItem('PageSessionID',helper.uuid())

				var that = this;
				that.getBeforeload() //获取开始加载的采集信息
				that.setParames();
				that.setDevice();


				(function(history){
						var replaceState = history.replaceState;
						if(replaceState){
								history.replaceState = function(state, param) {
										var url = arguments[2];
										if (typeof collect.onPushStateHandler == "function") {
												collect.onPushStateHandler({state: state, param: param, url: url});
										}
										return replaceState.apply(history, arguments);
								};
						}

				})(window.history);

				(function(history){
						var pushState = history.pushState;
						if(pushState){
								history.pushState = function(state, param) {
										var url = arguments[2];
										if (typeof collect.onPushStateHandler == "function") {
												collect.onPushStateHandler({state: state, param: param, url: url});
										}
										return pushState.apply(history, arguments);
								};
						}

				})(window.history);

				if ((document.readyState=='complete' || document.readyState=='interactive')&&!collect.isloaded) {
						collect.onload()
				} else {
						helper.on(document,'DOMContentLoaded',collect.onload)
				}

				delete that.parmas.syserror
		};

		collect.getBeforeload()
		collect.init();


		return {
				dispatch:collect.dispatch,
				storeUserId:collect.storeUserId,
		}

})(window);
