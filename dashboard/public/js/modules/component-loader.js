/**
 * Component Loader Utility
 * Loads HTML components dynamically
 */
export class ComponentLoader {
    constructor() {
        this.cache = new Map();
        this.basePath = './components/';
    }

    async loadComponent(componentName) {
        if (this.cache.has(componentName)) {
            return this.cache.get(componentName);
        }

        try {
            const response = await fetch(`${this.basePath}${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentName}`);
            }
            
            const html = await response.text();
            this.cache.set(componentName, html);
            return html;
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            return '';
        }
    }

    async insertComponent(componentName, targetSelector) {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) {
            console.error(`Target element not found: ${targetSelector}`);
            return false;
        }

        const componentHTML = await this.loadComponent(componentName);
        if (componentHTML) {
            targetElement.innerHTML = componentHTML;
            return true;
        }
        return false;
    }

    async loadComponents(components) {
        const promises = components.map(({ name, target }) => 
            this.insertComponent(name, target)
        );
        
        const results = await Promise.all(promises);
        return results.every(result => result === true);
    }

    clearCache() {
        this.cache.clear();
    }
}
