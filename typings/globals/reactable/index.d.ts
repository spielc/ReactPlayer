declare module "reactable" {

    import React = require("react");

    export interface TableComponentProperties<T> {
        data: T[],
        className?: string
    }

    
    export class Table<T> extends React.Component<TableComponentProperties<T>, {}> {

    }
}