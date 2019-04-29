# -*- coding: utf-8 -*-
from flask import Flask, render_template, request
from bs4 import BeautifulSoup
import requests
import random
import time
import json
import threading

app = Flask(__name__)



# 前端页面
@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

# 获取服务器时间
@app.route('/getServiceTime', methods=['GET'])
def getServiceTime():
    randomCode = random.random()
    url = 'https://www.epet.com/share/ajax.html?randomCode=%s'%randomCode
    req = requests.head(url)
    date = req.headers['Date']
    return date

# 获取商品信息
@app.route('/goodsInfo', methods=['GET'])
def goodsInfo():
    date = getBuyingTime()
    goodsInfo = getGoodsInfo(date)
    return goodsInfo

# 加购物车
@app.route('/addToCart', methods=['POST'])
def add():
    form = request.form
    addToCart(form)
    return '收到加购物车请求'

# 获取下一批抢购的时间
def getBuyingTime():
    struct = time.time()
    now_time = time.localtime(struct)
    nowHours = now_time[3]
    if nowHours < 10:
        result = '10:00'
    elif nowHours >= 10 and nowHours < 11:
        result = '11:00'
    elif nowHours >= 11 and nowHours < 12:
        result = '12:00'
    elif nowHours >= 12 and nowHours < 14:
        result = '14:00'
    elif nowHours >= 14 and nowHours < 16:
        result = '16:00'
    elif nowHours >= 16 and nowHours < 18:
        result = '18:00'
    elif nowHours >= 18 and nowHours < 20:
        result = '20:00'
    elif nowHours >= 20 and nowHours < 22:
        result = '22:00'
    else:
        result = '10:00'
    return result

# 获取商品 html
def getGoodsHtml(timeStr):
    url = 'https://cat.epet.com/share/activitys/suprise.html?do=getNewSurprise'
    headers = {
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language':'zh-CN,zh;q=0.8',
        'connection':'keep-alive',
        'cache-control':'no-cache',
        'content-length':'12',
        'content-type':'application/x-www-form-urlencoded; charset=UTF-8',
        # 'cookie': 'X15t_PET_TYPE=cat',
        'origin': 'https://cat.epet.com',
        'referer': 'https://cat.epet.com/',
        'user-agent':'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
        'x-requested-With':'XMLHttpRequest'
    }
    # 猫站
    cookies = dict(X15t_PET_TYPE='cat')
    catReq = requests.post(url, headers = headers, cookies = cookies, data = {'time': timeStr})
    catRes = catReq.text
    # 狗站
    dogReq = requests.post(url, headers = headers, data = {'time': timeStr})
    dogRes = dogReq.text
    res = catRes + dogRes
    return res

# 获取商品信息
def getGoodsInfo(timeStr):
    goodsArr = []
    date = time.localtime(time.time())
    deadline = '%s-%s-%s %s:00'%(date[0], date[1], date[2], timeStr)
    html = getGoodsHtml(timeStr)
    soup = BeautifulSoup(html)
    cut1All = soup.find_all('div', 'cut1')
    for cut in cut1All:
        li = cut.parent
        goods = {
            'title': li.find('div', 'goodsDes').string,
            'imgSrc': li.find('img')['src'],
            'price': li.find('span', 'ft20').string,
            'gid': li.find('input', 'gid')['value'],
            'atid': li.find('input', 'atid')['value'],
            'deadline': deadline,
        }
        goodsArr.append(goods)
    return json.dumps(goodsArr)

# 加购物车
def addToCart(goodsInfo):
    loopTime = int(1000 / float(goodsInfo['frequency']))
    url = 'https://www.epet.com/share/ajax.html'
    qs = {
        'gid': goodsInfo['gid'],
        'buytype': 'berserk',
        'pam': goodsInfo['atid'],
        'pam1': '%s|1'%(goodsInfo['gid']),
        'show_cart': False,
        'action': 'updatecart',
        'inajax': '1',
        'buynum': 1,
        'tp': 'add',
        'succeed_box': 1,
        'hash': random.random(),
    }
    data = {
        'qs': qs,
        'json': True,
    }
    headers = {
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language':'zh-CN,zh;q=0.8',
        'connection':'keep-alive',
        'cache-control':'no-cache',
        'content-length':'12',
        'content-type':'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': 'https://www.epet.com',
        'referer': 'https://www.epet.com/',
        'user-agent':'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
        'x-requested-With':'XMLHttpRequest',
        'cookie': "X15t_gott_auth=eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1NTQ4Nzk5MjgsInVzZXIiOnsidWlkIjo0NDAwODgzLCJhY0lkIjoiMzQ2OTQ0NDY1MjgzMzM4MjQiLCJuYW1lIjoi5Li75Lq6X0lPaTc3RjdKV24ifSwiaWF0IjoxNTU0ODc2MzI4fQ.MDPIqUHRNw-tShNVHkcP06aRTRFr0k6TFACubrbWHMI;",
    }
    req = requests.get(url, headers = headers, data = data)
    print('text', req.content)
    return '执行addToCart函数'








if __name__ == '__main__':
    app.run()

exceptions.TemplateNotFound
