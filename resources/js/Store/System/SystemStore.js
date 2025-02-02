import { defineStore } from 'pinia';
import axios from 'axios';
import { useUserStore } from '../User/UserStore';

export const useSystemStore = defineStore('system', {
    state: () => ({
        activeTab: 'invest',
        deals: [],
        bundles: []
    }),
    actions: {
        setActiveTab(tab) {
            this.activeTab = tab;
        },
        async fetchDeals() {
            const userStore = useUserStore();
            if (userStore.user?.id) {
                const response = await axios.get(`/api/deals/${userStore.user.id}`);
                this.deals = response.data;
            }
        },
        async fetchBundles() {
            const response = await axios.get(`/api/bundles`);
            this.bundles = response.data;
        }
    }
});
