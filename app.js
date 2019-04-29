/*
1，获取服务器时间
2，获取商品信息
*/



const arguments = process.argv.splice(2)
const express = require('express')
const path = require('path')
const ajax = require('request')
// 解析网页数据(转为 dom 树) 语法类似 jquery
const cheerio = require('cheerio')
const bodyParser = require('body-parser')



const sendHtml = function(path, response) {
    //引入 fs 模块
    let fs = require('fs')
    //options 对象包含编码格式，用于 fs 读取文件
    let options = {
        encoding:'utf-8'
    }
    //fs.readFile 读取文件，1、路径，2、编码，3、回调(1、错误，2、内容)
    fs.readFile(path, options, function(err, data){
        //console.log(`读取的html文件 ${path} 内容是`, data)
        response.send(data)
    })
}

// 前端服务
let openFeServer = () => {
    const app = express()
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(express.static(path.join(__dirname, 'fe')))
    //主页
    app.get('/', (request, response) => {
        let path = './fe/index.html'
        sendHtml(path, response)
    })
    // 获取商品信息
    app.get('/goodsInfo', (request, response) => {
        getGoods().then(goodsInfo => {
            response.send(goodsInfo)
        })
    })
    // 获取服务器时间
    app.get('/getServiceTime', (request, response) => {
        getServiceTime().then(time => {
            response.send(time)
        })
    })
    // 加购物车
    app.post('/addToCart', (request, response) => {
        addToCart(request.body)
        buyingResult.init()
        buyingNum.init()
        response.send('收到加购请求')
    })
    // 获取抢购结果
    app.get('/getResult', (request, response) => {
        let res = '抢了' + buyingNum.get() + '次；' + buyingResult.get()
        response.send(res)
        // 获取结果了，说明超过抢购时间了，停止抢购
        clearInterval(berserkTimer)
    })
    // 测试
    app.post('/test', (request, response) => {
        console.log('request', request);
        response.send('收到测试请求')
    })
    // 开启监听
    let port = arguments[0]
    let server = app.listen(arguments[0], function() {
        let host = server.address().address
        let port = server.address().port
        console.log(`请在浏览器地址栏输入 127.0.0.1:${port} 打开,如果运行的是 node master ，忽略这条`)
    })
}

// 获取下一批抢购的时间
const getBuyingTime = () => {
    let date = new Date()
    let nowHours = date.getHours()
    let time = "10:00"
    if (nowHours < 10) {
        time = "10:00"
    } else if (nowHours >= 10 && nowHours < 11) {
        time = "11:00"
    } else if (nowHours >= 11 && nowHours < 12) {
        time = "12:00"
    } else if (nowHours >= 12 && nowHours < 14) {
        time = "14:00"
    } else if (nowHours >= 14 && nowHours < 16) {
        time = "16:00"
    } else if (nowHours >= 16 && nowHours < 18) {
        time = "18:00"
    } else if (nowHours >= 18 && nowHours < 20) {
        time = "20:00"
    } else if (nowHours >= 20 && nowHours < 22) {
        time = "22:00"
    }
    return time
}

// 获取服务器时间
const getServiceTime = () => {
    let randomCode = Math.random()
    let url = `https://www.epet.com/share/ajax.html?randomCode=${randomCode}`
    let promise = new Promise(function(resolve, reject) {
        ajax.post(url, function(err, res, body) {
            let date = res.headers.date
            let time = new Date(date).getTime()
            resolve(new Date(time))
        })
    })
    return promise
}

// 获取猫站的商品
const getCatGoods = (time) => {
    let promise = new Promise(function(resolve, reject) {
        let date = new Date()
        let deadline = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${time}:00`
        let url = 'https://cat.epet.com/share/activitys/suprise.html?do=getNewSurprise'
        // 请求这个批次的抢购商品信息
        let options = {
            url,
            formData: {time},
            headers: {
                'cookie': 'X15t_PET_TYPE=cat;',
            },
        }
        // 请求抢购商品的信息
        let goodsArr = []
        let request = ajax.post(options, function(error, response, body) {
                let $ = cheerio.load(body)
                let cut1 = $('.cut1')
                cut1.each((index, element) => {
                    let li = $(element).parent()
                    let goods = {
                        title: li.find('.goodsDes').text(),
                        imgSrc: li.find('img').attr('src'),
                        price: li.find('.ft20').text(),
                        gid: Number(li.find('.gid').val()),
                        atid: Number(li.find('.atid').val()),
                        deadline,
                    }
                    goodsArr.push(goods)
                })
                resolve(goodsArr)
            }
        )
    })
    return promise
}

// 获取狗站的商品
const getDogGoods = (time) => {
    let promise = new Promise(function(resolve, reject) {
        let date = new Date()
        let deadline = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${time}:00`
        let url = 'https://www.epet.com/share/activitys/suprise.html?do=getNewSurprise'
        // 请求这个批次的抢购商品信息
        let options = {
            url,
            formData: {time},
        }
        // 请求抢购商品的信息
        let goodsArr = []
        let request = ajax.post(options, function(error, response, body) {
                let $ = cheerio.load(body)
                let cut1 = $('.cut1')
                cut1.each((index, element) => {
                    let li = $(element).parent()
                    let goods = {
                        title: li.find('.goodsDes').text(),
                        imgSrc: li.find('img').attr('src'),
                        price: li.find('.ft20').text(),
                        gid: Number(li.find('.gid').val()),
                        atid: Number(li.find('.atid').val()),
                        deadline,
                    }
                    goodsArr.push(goods)
                })
                resolve(goodsArr)
            }
        )
    })
    return promise
}

// 获取商品信息
const getGoods = () => {
    let promise = new Promise(function(resolve, reject) {
        let time = getBuyingTime()
        getDogGoods(time).then(dogGoods => {
            getCatGoods(time).then(catGoods => {
                let goodsArr = dogGoods.concat(catGoods)
                resolve(goodsArr)
            })
        })
    })
    return promise
}

// 存储抢购结果信息
let buyingResult = {
    init: () => {
        this.result = '没抢到~~'
    },
    set: (result) => {
        this.result = result
    },
    get: () => {
        return this.result
    },
}

// 抢购次数信息
let buyingNum = {
    add: (() => {
        this.sum = 0
        return () => {
            return ++this.sum
        }
    })(),
    init: () => {
        this.sum = 0
    },
    get: () => {
        return this.sum
    }
}

// 加购物车（被循环调用）
const addGoodsTocart = function (goodsInfo, url) {
    let qs = {
        gid: goodsInfo.gid,
        buytype: 'berserk',
        pam: goodsInfo.atid,
        pam1: `${goodsInfo.gid}|1`,
        show_cart: false,
        action: 'updatecart',
        inajax: '1',
        buynum: 1,
        tp: 'add',
        succeed_box: 1,
        hash: Math.random()
    }
    let options = {
        url,
        qs: qs,
        json: true,
        headers: {
            'cookie': `X15t_gott_auth=eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1NTQ4Nzk5MjgsInVzZXIiOnsidWlkIjo0NDAwODgzLCJhY0lkIjoiMzQ2OTQ0NDY1MjgzMzM4MjQiLCJuYW1lIjoi5Li75Lq6X0lPaTc3RjdKV24ifSwiaWF0IjoxNTU0ODc2MzI4fQ.MDPIqUHRNw-tShNVHkcP06aRTRFr0k6TFACubrbWHMI;`,
        },
    }
    buyingNum.add()
    let request = ajax.get(options, function(error, response, body) {
        body = body || ''
        if (body.includes('已抢完')) {
            // 延迟关闭请求
            setTimeout(function() {
                clearInterval(berserkTimer)
            }, 50)
        } else if (body.includes('抢购上限')) {
            buyingResult.set('抢到了，15分钟内去付款！')
            // 延迟关闭请求, 并跳转至购物车
            setTimeout(function() {
                clearInterval(berserkTimer)
            }, 50)
        }
    })
}

// 开始循环加入购物车
const addToCart = function (goodsInfo) {
    let loopTime = parseInt(1000 / goodsInfo.frequency)
    let url = 'https://www.epet.com/share/ajax.html'
    berserkTimer =  setInterval(function () {
        addGoodsTocart(goodsInfo, url)
    }, loopTime)
    // 过抢购时间后关闭加购物车请求
    let time = (Number(goodsInfo.speedinessTime) * 1000) + 100
    setTimeout(() => {
        clearInterval(berserkTimer)
        let body = {
            result: buyingResult.get(),
            num: buyingNum.get(),
        }
        let options = {
            url: 'http://127.0.0.1/sendResult',
            form: body,
        }
        // 发送抢购结果给 master
        ajax.post(options, (err, res, body) => {})
    }, time)
}

const __main = () => {
    // 开启前端服务
    openFeServer()
}

__main()
