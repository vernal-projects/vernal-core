export function isSubClass(subclass: any, superClass: any) {
    let prototype = subclass.prototype;
    do {
      if (prototype === superClass.prototype) return true;
    } while (prototype = Object.getPrototypeOf(prototype));
    return false;
}