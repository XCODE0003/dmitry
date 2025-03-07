import { defineStore } from 'pinia';
import axios from 'axios';
import { useUserStore } from '../User/UserStore';

export const useSystemStore = defineStore('system', {
    state: () => ({
        activeTab: 'work',
        deals: [],
        bundles: [],
        categories: []
    }),
    watch: {
        activeTab: {
            handler() {
                this.fetchBundles();
            },
        },
    },
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
            const response = await axios.get(`/api/bundles?category_id=${this.activeTab}`);
            this.bundles = response.data;
        },
        async fetchCategories() {
            const response = await axios.get(`/api/categories`);
            this.categories = response.data;
        }
    }
});
