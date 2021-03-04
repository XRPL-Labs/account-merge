<template>
    {{ state.nodetype }}
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
                        {{ destination }}
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
</template>

<script>
import axios from 'redaxios'
import Header from '@/components/Header.vue'
import Spinner from '@/components/Spinner.vue'
import Alert from '@/components/Alert.vue'

export default {
    components: { Header, Spinner, Alert },
    props: ['state'],
    data() {
        return {
            activeIndex: 0,
            steps: ['', '', ''],
            busy: false,
            error: false,
            msg: '',
            account: '',
            destination: ''
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
        openSignRequest(uuid) {
            if (typeof window.ReactNativeWebView === 'undefined') throw new Error('Error getting object from React Native')
            window.ReactNativeWebView.postMessage(JSON.stringify({
                command: 'openSignRequest',
                uuid: uuid
            }))
        },
        ws(url) {
            return new Promise((resolve, reject) => {
                const socket = new WebSocket(url)
                socket.onmessage = msg => {
                    const data = JSON.parse(msg.data)
                    if (data.signed) {
                        // if user signs the reques 
                        resolve(data)
                        socket.close()
                    } else if(data.signed === false) {
                        // If user closes the sign request
                        reject(data)
                        socket.close()
                    }
                }
                socket.onclose = msg => {
                    reject(msg)
                }
                socket.onerror = e => {
                    reject(e)
                    socket.close()
                }
            })
        },
        getWebSocketUrl(nodetype) {
            switch (nodetype) {
                case "MAINNET":
                    return 'wss://xrplcluster.com'
                case "TESTNET":
                    return 'wss://testnet.xrpl-labs.com'
            }
            return 'wss://xrplcluster.com'
        },
        accountInfo(account) {
            const command = {
                id: 666,
                command: "account_objects",
                account: account,
                ledger_index: "validated",
                deletion_blockers_only: true,
                limit: 10
            }
            return new Promise((resolve, reject) => {
                const socket = new WebSocket(this.getWebSocketUrl(this.state.nodetype))
                socket.onopen = event => {
                    socket.send(JSON.stringify(command))
                }
                socket.onmessage = msg => {
                    const data = JSON.parse(msg.data)
                    if (data.error) reject(data)
                    if (data.id == 666) {
                        resolve(data)
                        socket.close()
                    }
                    this.msg = data
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
                        this.openSignRequest(res.data.uuid)
                        const status = await this.ws(res.data.refs.websocket_status)
                        const result = await axios.get(`${this.endpoint}/payload/${status.payload_uuidv4}`)
                        this.account = result.data.response.account

                        const test = await this.accountInfo(this.account)
                        if (test.result.account_objects.length >= 1) throw new Error('There are account objects that prevents you from deleting this account')
                        this.msg = test
                    } catch(e) {
                        this.error = true
                        this.msg = e
                        console.log(e)
                    }
                    break
                case 1:
                    try {
                        const payload = {
                            user_token: this.token,
                            txjson: {
                                TransactionType: "SignIn"
                            }
                        }
                        const res = await axios.post(`${this.endpoint}/payload`, payload)
                        this.openSignRequest(res.data.uuid)
                        const status = await this.ws(res.data.refs.websocket_status)
                        const result = await axios.get(`${this.endpoint}/payload/${status.payload_uuidv4}`)
                        this.destination = result.data.response.account
                    } catch(e) {
                        this.error = true
                        this.msg = e
                        console.log(e)
                    }
                    break
                case 2:
                    try {
                        const payload = {
                            user_token: this.token,
                            txjson: {
                                TransactionType: "AccountDelete",
                                Account: this.account,
                                Destination: this.destination,
                                // DestinationTag: null
                            }
                        }
                        const res = await axios.post(`${this.endpoint}/payload`, payload)
                        this.openSignRequest(res.data.uuid)
                        const status = await this.ws(res.data.refs.websocket_status)
                        const result = await axios.get(`${this.endpoint}/payload/${status.payload_uuidv4}`)
                        this.msg = result.data.response.dispatched_result
                    } catch (e) {
                        this.error = true
                        console.log(e)
                        this.msg = e
                    }
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