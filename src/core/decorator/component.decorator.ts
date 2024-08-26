import {ClassType} from "../type/class.type.js";
import {TokenInfoType} from "../type/token-info.type.js";
import {StereotypeComponent} from "../type/stereotype-component.type.js";

export const COMPONENT_REGISTRY: Map<ClassType, TokenInfoType> = new Map();

export function Component(token: string) {
    return function (componentClass: ClassType) {
        if (!token || !token.trim()) throw new Error(`${componentClass.name}': valid token is required`);
        COMPONENT_REGISTRY.forEach((value, key) => {
            if (value.token === token) throw new Error(`Token: ${value} is already associated with the ${key.name}`);
        })
        const tokenInfo = getTokenInfo(token);
        COMPONENT_REGISTRY.set(componentClass, tokenInfo);
    }
}

function getTokenInfo(token: string): TokenInfoType {
    const groups = /((?<type>service|repository|controller):)?(?<token>.*)/.exec(token)!.groups!;
    return {type: <StereotypeComponent>groups.type ?? 'component', token: groups.token}
}

export function Service(token: string) {
    return Component("service:" + token);
}

export function Repository(token: string) {
    return Component("repository:" + token);
}

export function Controller(token: string) {
    return Component("controller:" + token);
}