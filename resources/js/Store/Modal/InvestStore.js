import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useInvestModalStore = defineStore('investModal', () => {
    const modalConfig = ref({
        teleportTo: 'body',
        modelValue: false,
        displayDirective: 'if',
        hideOverlay: false,
        overlayTransition: 'vfm-fade',
        contentTransition: ' vfm-slide-up',
        clickToClose: true,
        escToClose: true,
        background: 'non-interactive',
        lockScroll: true,
        reserveScrollBarGap: true,
        swipeToClose: 'none',
        bundle: null
    })

    const openModal = (bundle) => {
        modalConfig.value.modelValue = true
        modalConfig.value.bundle = bundle
    }

    const closeModal = () => {
        modalConfig.value.modelValue = false
        modalConfig.value.bundle = null
    }

    return {
        modalConfig,
        openModal,
        closeModal
    }
})
