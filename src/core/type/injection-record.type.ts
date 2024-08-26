export interface InjectionRecordType {
    injectionType: "constructor" | "property";
    token: string;
    key: string | number | symbol
}