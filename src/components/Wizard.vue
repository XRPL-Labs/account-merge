<template>
    <Header />
    <div class="vertical-wizard">
        <ul>
            <li v-for="(step, index) in steps" :class="getStepClass(index)" :key="index">
                <a>
                    {{ $t(`wizard.step_${index}.header`) }}
                    <fa v-if="index < activeIndex" class="ico ico-green" :icon="['fa', 'check']"></fa>
                    <fa v-if="index > activeIndex" class="ico ico-muted" :icon="['fa', 'lock']"></fa>
                    <span class="desc d-block">
                        {{ $t(`wizard.step_${index}.body`) }}
                        {{ account }}
                        <a @click="next()" v-if="index === activeIndex" class="d-block shadow py-1 btn-block text-white btn btn-lg btn-primary mt-3" :class="{ disabled: busy }">
                            {{ $t(`wizard.step_${index}.button`) }}
                            <fa v-if="!busy" :icon="['fas', 'arrow-right']"/>
                            <Spinner v-else/>
                        </a>
                    </span>
                </a>
            </li>
        </ul>
    </div>
    <Alert v-if="error || msg" type="danger" :msg="msg"/>
    {{ token }}
</template>

<script>
import axios from 'redaxios'
import Header from '@/components/Header.vue'
import Spinner from '@/components/Spinner.vue'
import Alert from '@/components/Alert.vue'

export default {
    components: { Header, Spinner, Alert },
    data() {
        return {
            activeIndex: 0,
            steps: ['', '', ''],
            busy: false,
            error: false,
            msg: '',
            account: ''
        }
    },
    methods: {
        getStepClass(index) {
            const obj = {
                current: this.activeIndex === index,
                complete: this.activeIndex > index,
                'prev-step': this.activeIndex === (index - 1),
                locked: this.activeIndex < index
            }
            return obj
        },
        ws(url) {
            return new Promise((resolve, reject) => {
                const socket = new WebSocket(url)
                socket.onmessage = msg => {
                    const data = JSON.parse(msg.data)
                    if (data.signed) {
                        resolve(data)
                        socket.close()
                    }
                }
                socket.onclose = msg => {
                    reject(msg)
                }
                socket.onerror = e => {
                    reject(e)
                }
            })
        },
        async next() {
            this.busy = true
            this.error = false

            switch(this.activeIndex) {
                case 0:
                    try {
                        const payload = {
                            user_token: this.token,
                            txjson: {
                                TransactionType: "SignIn"
                            }
                        }
                        const res = await axios.post(`${this.endpoint}/payload`, payload)
                        if (typeof window.ReactNativeWebView === 'undefined') throw new Error('Error getting object from React Native')
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            command: 'openSignRequest',
                            uuid: res.data.uuid
                        }))
                        const status = await this.ws(res.data.refs.websocket_status)
                        const result = await axios.get(`${this.endpoint}/payload/${status.payload_uuidv4}`)
                        this.account = result.data.response.account
                    } catch(e) {
                        this.error = true
                        this.msg = e
                        console.log(e)
                    }
                    break
                case 1:

                    // try {
                    //     const res = await axios({
                    //         method: 'post',
                    //         url: 'https://xumm.app/api/v1/platform/payload',
                    //         data : {
                    //             user_token: "c5bc4ccc-28fa-4080-b702-0d3aac97b993",
                    //             txjson: {
                    //                 TransactionType: "AccountDelete",
                    //                 Account: "rXXX",
                    //                 Destination: "rXXX",
                    //                 // DestinationTag: null
                    //             }
                    //         }
                    //     })
                    // } catch (e) {
                    //     this.error = true
                    //     console.log(e)
                    // }
                    break
                case 2:
                    console.log('twee')
                    break
            }
            this.busy = false
            if (this.error) return null
            this.activeIndex ++
        }
    }
}
</script>

<style scoped>

</style>