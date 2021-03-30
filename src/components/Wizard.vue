<template>
    <Header />
    <div class="vertical-wizard">
        <ul>
            <li v-for="(step, index) in steps" :class="getStepClass(index)" :key="index">
                <a @click="changeIndex(index)">
                    {{ $t(`wizard.step_${index}.header`) }}
                    <fa v-if="index < activeIndex" class="ico ico-green" :icon="['fa', 'check']"></fa>
                    <fa v-if="index > activeIndex" class="ico ico-muted" :icon="['fa', 'lock']"></fa>
                    <span class="desc d-block">
                        {{ $t(`wizard.step_${index}.body`) }}
                        <a @click="next()" v-if="index === activeIndex" class="d-block shadow py-1 btn-block text-white btn btn-lg btn-primary mt-3" :class="{ disabled: busy }">
                            {{ $t(`wizard.step_${index}.button`) }}
                            <fa v-if="!busy" :icon="['fas', 'arrow-right']"/>
                            <Spinner v-else/>
                        </a>
                    </span>
                </a>
            </li>
            <a v-if="finished" @click="close()" class="d-block shadow py-1 btn-block text-white btn btn-lg btn-success mt-3">
                {{ $t('wizard.success') }}
            </a>
        </ul>
        <!-- <Alert v-if="error || msg" type="danger" :msg="msg"/> -->
    </div>
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
            // Array for steps is only used for loop
            steps: ['', '', ''],
            busy: false,
            error: false,
            msg: '',
            account: '',
            destination: '',
            finished: false,
        }
    },
    mounted() {
        // axios defaults is not working
        axios.defaults = { headers: { Authorization: this.state.token, 'x-api-key': this.apikey } }
    },
    methods: {
        close() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                command: 'close'
            }))
        },
        changeIndex(index) {
            if (this.activeIndex > index) this.activeIndex = index
        },
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
            if (typeof window.ReactNativeWebView === 'undefined') throw new Error(this.$t('wizard.error.reactNative'))
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
                        // if the user signs the request
                        resolve(data)
                        socket.close()
                    } else if(data.signed === false) {
                        // If the user closes the sign request
                        reject('')
                        socket.close()
                    }
                }
                socket.onclose = msg => {
                    reject(this.$t('wizard.error.closed'))
                }
                socket.onerror = e => {
                    reject(this.$t('wizard.error.websocket'))
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
                    if (data.error) {
                        reject(this.$t(`wizard.error.${data.error}`))
                    }
                    if (data.id == 666) {
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
        throwError(e) {
            this.error = true
            if (e === '') return
            if (e.status === 403) e = this.$t('wizard.error.403')
            this.msg = e
            console.log(e)
            this.$swal({
                icon: 'error',
                title: 'Oops...',
                text: e
            })
        },
        async next() {
            this.msg = ''
            this.busy = true
            this.error = false

            const headers = { headers: { Authorization: this.state.token } }

            switch(this.activeIndex) {
                case 0:
                    try {
                        const payload = {
                            user_token: this.token,
                            txjson: {
                                TransactionType: "SignIn"
                            }
                        }

                        const res = await axios.post(`${this.endpoint}/payload`, payload, headers)
                        this.openSignRequest(res.data.uuid)
                        const status = await this.ws(res.data.refs.websocket_status)
                        const result = await axios.get(`${this.endpoint}/payload/${status.payload_uuidv4}`, headers)

                        this.account = result.data.response.account

                        const test = await this.accountInfo(this.account)
                        if (test.result.account_objects.length >= 1) throw new Error(this.$t('wizard.error.hasObjects'))
                    } catch(e) {
                        this.throwError(e)
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
                        const res = await axios.post(`${this.endpoint}/payload`, payload, headers)
                        this.openSignRequest(res.data.uuid)
                        const status = await this.ws(res.data.refs.websocket_status)
                        const result = await axios.get(`${this.endpoint}/payload/${status.payload_uuidv4}`, headers)
                        if (this.account === result.data.response.account) throw new Error(this.$t('wizard.error.equalAccounts'))
                        this.destination = result.data.response.account
                    } catch(e) {
                        this.throwError(e)
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
                        const res = await axios.post(`${this.endpoint}/payload`, payload, headers)
                        this.openSignRequest(res.data.uuid)
                        const status = await this.ws(res.data.refs.websocket_status)
                        const result = await axios.get(`${this.endpoint}/payload/${status.payload_uuidv4}`, headers)
                        if (result.data.response.dispatched_result !== 'tesSUCCESS') throw new Error(this.$t(`wizard.error.${result.data.response.dispatched_result}`))
                        this.msg = this.$t('wizard.success')
                        this.finished = true
                    } catch (e) {
                        this.throwError(e)
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
