import {ClassType} from "./type/class.type.js";
import {CONFIGURATION_REGISTRY} from "./decorator/component-scan.decorator.js";
import {INJECTION_REGISTRY} from "./decorator/autowired.decorator.js";
import {COMPONENT_REGISTRY} from "./decorator/component.decorator.js";
import {ContextPlugin} from "./type/context-plugin.type.js";

export class AppContext {

    private readonly definitions: Array<ClassType>;
    private readonly configClass: ClassType;
    private readonly singletons: Map<string, any> = new Map();
    private static readonly contextPlugins: Array<ContextPlugin> = [];

    constructor(configClass: ClassType) {
        if (!CONFIGURATION_REGISTRY.has(configClass)) {
            throw new Error("Configuration class should be annotated with the @ComponentScan decorator");
        }
        this.configClass = configClass;
        this.definitions = CONFIGURATION_REGISTRY.get(configClass)!;
        AppContext.contextPlugins.forEach(plugin => {
            plugin.beforeInitialized && plugin.beforeInitialized(this, this.definitions);
        })
        for (const definition of this.definitions) {
            if (this.singletons.has(COMPONENT_REGISTRY.get(definition)!.token)) continue;
            this.inject(definition, [definition]);
        }
        AppContext.contextPlugins.forEach(plugin => {
            plugin.initialized && plugin.initialized(this);
        })
    }

    protected getSingletons(){
        return this.singletons;
    }

    public static registerPlugin(plugin: ContextPlugin) {
        AppContext.contextPlugins.push(plugin);
    }

    public getConfigClass(): ClassType {
        return this.configClass;
    }

    public getComponent<T>(componentClass: ClassType): T;
    public getComponent<T>(token: string): T;
    public getComponent<T>(input: string|ClassType) {
        if (typeof input === "string"){
            return this.singletons.get(input) || null;
        }else{
            return this.containsComponentDefinition(input) ? this.singletons.get(COMPONENT_REGISTRY.get(input)!.token) : null;
        }
    }

    public containsComponentDefinition(componentClass: ClassType): boolean {
        return !!this.definitions.find(def => def === componentClass);
    }

    public getComponentDefinitions(): Array<ClassType>{
        return [...this.definitions];
    }

    private inject(componentClass: ClassType, injectionQueue: ClassType[]) {
        const injectionRecords = INJECTION_REGISTRY.get(componentClass) || [];

        const constructorInjectionRecords = injectionRecords.filter(record => record.injectionType === 'constructor');
        let args: { [key: number]: any } = {}
        let maxParamIndex = 0;
        for (const constructorInjectionRecord of constructorInjectionRecords) {
            if (maxParamIndex < <number>constructorInjectionRecord.key) maxParamIndex = <number>constructorInjectionRecord.key;
            if (!this.singletons.has(constructorInjectionRecord.token)) {
                const index = Array.from(COMPONENT_REGISTRY.values()).findIndex(tokenInfo => tokenInfo.token === constructorInjectionRecord.token);
                const dependencyComponentClass = Array.from(COMPONENT_REGISTRY.keys())[index];
                if (!this.containsComponentDefinition(dependencyComponentClass)) throw new Error(`Unsatisfied dependency for the token: ${constructorInjectionRecord.token}`);
                if (injectionQueue.find(c => c === dependencyComponentClass)) throw new Error(`Circular dependency injection detected: ${componentClass.name} <-> ${dependencyComponentClass.name}`);
                this.inject(dependencyComponentClass, [...injectionQueue, dependencyComponentClass]);
            }
            args[<number>constructorInjectionRecord.key] = this.singletons.get(constructorInjectionRecord.token);
        }
        maxParamIndex++;
        const constructorArgs = Array.from({
            ...Array(maxParamIndex).fill(undefined), ...args,
            length: maxParamIndex
        });
        AppContext.contextPlugins.forEach(plugin =>{
            plugin.beforeConstructorInjection && plugin.beforeConstructorInjection(this, componentClass, constructorArgs);
        });
        const singleton = new componentClass(...constructorArgs);

        const propertyInjectionRecords = injectionRecords.filter(record => record.injectionType === 'property');
        for (const propertyInjectionRecord of propertyInjectionRecords) {
            if (!this.singletons.has(propertyInjectionRecord.token)) {
                const index = Array.from(COMPONENT_REGISTRY.values()).findIndex(tokenInfo => tokenInfo.token === propertyInjectionRecord.token);
                const dependencyComponentClass = Array.from(COMPONENT_REGISTRY.keys())[index];
                if (!this.containsComponentDefinition(dependencyComponentClass)) throw new Error(`Unsatisfied dependency for the token: ${propertyInjectionRecord.token}`);
                if (injectionQueue.find(c => c === dependencyComponentClass)) throw new Error(`Circular dependency injection detected: ${componentClass.name} <-> ${dependencyComponentClass.name}`);
                this.inject(dependencyComponentClass, [...injectionQueue, dependencyComponentClass]);
            }
            singleton[propertyInjectionRecord.key] = this.singletons.get(propertyInjectionRecord.token);
        }

        injectionQueue.splice(injectionQueue.findIndex(c => c === componentClass), 1);
        this.singletons.set(COMPONENT_REGISTRY.get(componentClass)!.token, singleton);
        AppContext.contextPlugins.forEach(plugin =>{
            plugin.afterPropertyInjections && plugin.afterPropertyInjections(this, componentClass, singleton);
        });
        return singleton;
    }
}