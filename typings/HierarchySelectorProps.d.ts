/**
 * This file was generated from HierarchySelector.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import {
    ActionValue,
    DynamicValue,
    ListExpressionValue,
    ListReferenceValue,
    ListValue,
    ReferenceSetValue
} from "mendix";
import { CSSProperties } from "react";

export interface HierarchySelectorContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    parentSource: ListValue;
    parentCaption: ListExpressionValue<string>;
    childSource: ListValue;
    childCaption: ListExpressionValue<string>;
    childParent: ListReferenceValue;
    childLimit: number;
    selection: ReferenceSetValue;
    clearOnParentChange: boolean;
    onChange?: ActionValue;
    parentLabel?: DynamicValue<string>;
    parentPlaceholder?: DynamicValue<string>;
    emptyMessage?: DynamicValue<string>;
    showSearch: boolean;
    showSelectAll: boolean;
    showCount: boolean;
    minColumnWidth: number;
}

export interface HierarchySelectorPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    parentSource: {} | { caption: string } | { type: string } | null;
    parentCaption: string;
    childSource: {} | { caption: string } | { type: string } | null;
    childCaption: string;
    childParent: string;
    childLimit: number | null;
    selection: string;
    clearOnParentChange: boolean;
    onChange: {} | null;
    parentLabel: string;
    parentPlaceholder: string;
    emptyMessage: string;
    showSearch: boolean;
    showSelectAll: boolean;
    showCount: boolean;
    minColumnWidth: number | null;
}
