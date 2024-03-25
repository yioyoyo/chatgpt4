import { Index, Show, createSignal, onMount } from 'solid-js'

import type { Accessor, Setter } from 'solid-js'
import type { User } from '@/types'
interface Props {
  setUser: Setter<User>
  user: Accessor<User>
}

interface PayInfoType { name: string, price: number, tips: string }

export default (props: Props) => {
  onMount(async() => {
    getPayInfo()
    setInterval(() => {
      const userJson = JSON.parse(localStorage.getItem('user') as string)
      props.user().word = userJson.word
      props.user().temp_times = userJson.temp_times
      props.user().expired_at = userJson.expired_at
      props.setUser({ ...props.user() })
    }, 3000)
  })
  let qr = ''
  let emailRef: HTMLInputElement

  const [countdown, setCountdown] = createSignal(0)
  const [url, setUrl] = createSignal('')
  const [showCharge, setShowCharge] = createSignal(false)

  const [payinfo, setPayinfo] = createSignal<PayInfoType[]>([{ name: '', price: 0, tips: '' }])

  const selfCharge = async() => {
    const response = await fetch('/api/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: localStorage.getItem('token'),
        code: emailRef.value,
      }),
    })
    const responseJson = await response.json()
    if (responseJson.code === 200) {
      alert(responseJson.data.msg)
      localStorage.setItem('user', JSON.stringify(responseJson.data))
      // props.setUser(responseJson.data)
      setShowCharge(false)
    } else {
      alert(responseJson.message)
    }
  }

  const getPayInfo = async() => {
    const response = await fetch('/api/getpayinfo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: localStorage.getItem('token'),
      }),
    })
    const responseJson = await response.json()
    if (responseJson.code === 200)
      setPayinfo(responseJson.data)
    else
      alert(responseJson.message)
  }

  const close = () => {
    setShowCharge(false)
  }
  const isMobile = () => {
    const flag = navigator.userAgent.match(
      /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i,
    )
    return flag
  }
  const getPaycode = async(price: number) => {
    qr = ''
    let flow_id = ''
    const response = await fetch('/api/getpaycode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: localStorage.getItem('token'),
        price,
      }),
    })
    const responseJson = await response.json()
    if (responseJson.code === 200) {
      if (isMobile())
        qr = responseJson.data.qr

      setUrl(responseJson.data.url)
      flow_id = responseJson.data.flow_id
      setCountdown(300)
      const intv = setInterval(() => {
        setCountdown(countdown() - 1)
        if (countdown() <= 0) {
          clearInterval(intv)
          setShowCharge(false)
          setUrl('')
        }
      }, 1000)

      // 检查是否到账
      const intv2 = setInterval(async() => {
        if (countdown() <= 0) {
          clearInterval(intv2)
        } else {
          const response = await fetch('/api/paynotice', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: localStorage.getItem('token'),
              flow_id,

            }),
          })
          const responseJson = await response.json()
          if (responseJson.code === 200) {
            if (responseJson.data.msg === '充值已到账') {
              localStorage.setItem('user', JSON.stringify(responseJson.data))
              // props.setUser(responseJson.data)
              alert(responseJson.data.msg)
              setShowCharge(false)
              setUrl('')
            }
          }
        }
      }, 3000)
    } else {
      alert(responseJson.message)
    }
  }

  return (
    <div id="input_container" class="mt-2 max-w-[450px]">
      <div class="fi mt-12">
        <span class="text-(2xl transparent) font-extrabold bg-(clip-text gradient-to-r) from-sky-400 to-emerald-600">CHATXYZ & GPT4.0</span>
      </div>
      <p mt-1 op-60>
        Hi,{props.user().nickname} 剩余额度{props.user().word}字
        <Show when={props.user().temp_times > 0}>
          ;{props.user().temp_times}次({props.user().expired_at}到期)
        </Show>

        <span onClick={() => { setShowCharge(true) }} class="border-1 px-2 py-1 ml-2 rounded-md transition-colors bg-slate/20 cursor-pointer hover:bg-slate/50">支付宝充值</span>
      </p>
      <Show when={showCharge()}>
        <div class="mt-4">
          <Show when={!url()}>
            <a href="https://appfront0220.s3.ap-southeast-1.amazonaws.com/qmzc/2023-02-23/WechatIMG35.jpeg">如充值未到账或有使用问题,请点击联系客服</a><br />
            <span class="text-sm">
              超值月卡活动进行中,请选择充值套餐,字数套餐按<span class="font-extrabold">字数计费(无时间限制,无购买限制)</span>
              ;月卡按<span class="font-extrabold">提问次数计费(30天有效期,每30天可购买一次月卡)</span>
            </span>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-1">
              <Index each={payinfo()}>
                {(v, _) => {
                  const [showTooltip, setShowTooltip] = createSignal(false)

                  return (
                    <div onClick={() => { getPaycode(v().price) }} class="col-span-1 h-12 mt-2 px-4 py-2 bg-slate bg-opacity-15 hover:bg-opacity-20 text-xs rounded-sm relative">
                      <button >
                        {v().name}
                      </button>
                      <Show when={v().tips}>
                        <div
                          class="absolute top-0 right-0 p-1"
                          onClick={event => event.stopPropagation()}
                          onMouseEnter={() => setShowTooltip(true)}
                          onMouseLeave={() => setShowTooltip(false)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 text-gray-500">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 00-2 0v4a1 1 0 002 0V6zm-1 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                          </svg>
                          {showTooltip() && (
                            <div class="absolute right-0 top-full mt-2 w-38 rounded-md shadow-lg bg-white ring-1 ring-black  bg-white z-10">
                              <div class="p-4">
                                <p>{v().tips}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </Show>
                    </div>
                  )
                }}
              </Index>
            </div>

          </Show>
          <Show when={url()}>
            <div class="flex flex-col">
              <span class="text-sm">
                请在{countdown()}秒内完成支付
              </span>
              <img class="w-3/5 max-w-[200px] mt-2" src={url()} />
            </div>
            <Show when={qr}>
              <div class="mt-4 flex space-x-2">
                <a target="_blank" href={qr} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" rel="noreferrer">去支付
                </a>
              </div>
            </Show>
          </Show>
        </div>

        <hr class="mt-4" />
        <div class="flex mt-4">
          <span class="text-sm">
            有兑换码? 可在下方输入字数兑换码
          </span>
        </div>

        <input
          ref={emailRef!}
          placeholder="请输入字数兑换码"
          type="text"
          class="px-4 py-3 h-12 rounded-sm bg-(slate op-15) base-focus w-full mt-2"
          value=""
        />
        <button onClick={selfCharge} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm">
          兑换
        </button>
        <button onClick={close} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm ml-2">
          关闭
        </button>
      </Show>
    </div>
  )
}
