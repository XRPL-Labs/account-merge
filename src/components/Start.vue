<template>
    {{ test.account }}
    <Header />
    <div>
        <p>{{ $t("start.description") }}</p>
    </div>
    <div class="my-3 text-center h4">
        <Illustration />
    </div>
    <div class="shadow-sm mt-3 alert alert-primary px-3 py-2">
        {{ $t("start.list_header") }}
        <ol class="mb-0 pb-0 mt-1 ml-0 pl-4">
            <li>{{ $t("start.list_item_1") }}</li>
            <li>{{ $t("start.list_item_2") }}</li>
        </ol>
    </div>
    <div class="mt-4 text-center">
        <a v-if="ready" @click.prevent="next()" class="shadow btn btn-lg btn-primary btn-block" >
            {{ $t("start.button") }}
            <fa :icon="['fas', 'arrow-right']"/>
        </a>
        <a v-else class="shadow btn btn-lg btn-primary btn-block disabled" >
            <Spinner />
        </a>
    </div>
    <Alert v-if="error" type="danger" :msg="error"/>
</template>

<script>
import axios from 'redaxios'
import Header from '@/components/Header.vue'
import Illustration from '@/components/Illustration.vue'
import Spinner from '@/components/Spinner.vue'
import Alert from '@/components/Alert.vue'

export default {
    components: { Header, Illustration, Spinner, Alert },
    data() {
        return {
            ott: Object,
            ready: false,
            test: 'test',
            error: ''
        }
    },
    async mounted() {
        this.ready = true
        try {
            const res = await axios({
                method: 'get',
                url: `${this.endpoint}/xapp/ott/${this.token}`
            })
            this.test = res.data
        } catch(e) {
            console.error(e)
            this.error = e
        }
    },
    methods: {
        next() {
            window.history.pushState('prop', 'title', '/wizard')
            const popStateEvent = new PopStateEvent('popstate', { state: 'state' })
            dispatchEvent(popStateEvent)
        }
    }
}
</script>
