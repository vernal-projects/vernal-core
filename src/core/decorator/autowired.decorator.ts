import {ClassType} from "../type/class.type.js";
import {InjectionRecordType} from "../type/injection-record.type.js";

export const INJECTION_REGISTRY: Map<ClassType, Array<InjectionRecordType>> = new Map();

export function Autowired(token: string) {
    return function (target: object, key: any, index?: number) {
        if (index === undefined) {
            // property injection
            const componentClass = target.constructor as ClassType;
            const injectionRecords = INJECTION_REGISTRY.get(componentClass) ?? INJECTION_REGISTRY.set(target.constructor as ClassType, []).get(componentClass)!;
            injectionRecords.push({
                key,
                token,
                injectionType: "property"
            });
        } else {
            // constructor injection
            const componentClass = target as ClassType;
            const injectionRecords = INJECTION_REGISTRY.get(target as ClassType) ?? INJECTION_REGISTRY.set(componentClass as ClassType, []).get(componentClass)!;
            injectionRecords.push({
                key: index,
                token,
                injectionType: "constructor"
            });
        }
    }
}