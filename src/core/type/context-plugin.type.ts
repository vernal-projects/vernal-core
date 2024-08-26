import {AppContext} from "../app-context.js";
import {ClassType} from "./class.type.js";

export abstract class ContextPlugin {
    beforeInitialized(context: AppContext, componentDefinitions: Array<ClassType>){}
    initialized(context: AppContext){}
    beforeConstructorInjection(context: AppContext, componentClass: ClassType, args: Array<any>){}
    afterPropertyInjections(context: AppContext, componentClass: ClassType, singleton: object){}
}
