import {ClassType} from "../type/class.type.js";
import {COMPONENT_REGISTRY} from "./component.decorator.js";
import {INJECTION_REGISTRY} from "./autowired.decorator.js";

export const CONFIGURATION_REGISTRY: Map<ClassType, Array<ClassType>> = new Map();

export function ComponentScan(componentClasses: Array<ClassType>) {
    return function (configClass: ClassType) {
        const invalidComponent = componentClasses.find(component => !COMPONENT_REGISTRY.has(component));
        if (invalidComponent) throw new Error(`${invalidComponent} should be annotated with the @Component decorator`);

        INJECTION_REGISTRY.forEach((records, componentClass) => {
            records.forEach(record => {
                if (record.token === COMPONENT_REGISTRY.get(componentClass)!.token)
                    throw new Error(`${componentClass.name}: self injecting is not allowed`);
                if (componentClasses.find(c => c === componentClass)) {
                    if (!Array.from(COMPONENT_REGISTRY.values()).find(token => token.token === record.token))
                        throw new Error(`Unsatisfied dependency for the token: ${record.token} `) ;
                }
            });
        });

        CONFIGURATION_REGISTRY.set(configClass, componentClasses);
    }
}