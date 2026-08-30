import { ChangeEvent, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ObjectItem, ValueStatus } from "mendix";
import { association, equals, literal } from "mendix/filters/builders";
import { HierarchySelectorContainerProps } from "../typings/HierarchySelectorProps";
import "./ui/HierarchySelector.scss";

function text(value: { value?: string } | undefined): string {
    return value?.value ?? "";
}

export function HierarchySelector(props: HierarchySelectorContainerProps): ReactElement {
    const {
        name,
        class: className,
        style,
        tabIndex,
        parentSource,
        parentCaption,
        childSource,
        childCaption,
        childParent,
        childLimit,
        selection,
        clearOnParentChange,
        onChange,
        parentLabel,
        parentPlaceholder,
        emptyMessage,
        showSearch,
        showSelectAll,
        showCount,
        minColumnWidth
    } = props;

    const [parentId, setParentId] = useState<string>("");
    const [query, setQuery] = useState<string>("");
    const previousParent = useRef<string>("");

    const readOnly = selection.readOnly;

    const parents: ObjectItem[] = parentSource.status === ValueStatus.Available ? parentSource.items ?? [] : [];
    const selectedParent = useMemo(() => parents.find(item => item.id === parentId), [parents, parentId]);

    // Cap how much of the child list is fetched. Without this only the first
    // page is loaded, and "select all" would silently mean "select the first page".
    useEffect(() => {
        childSource.setLimit(childLimit > 0 ? childLimit : undefined);
    }, [childSource, childLimit]);

    // The whole trick: re-filter the child data source from the client whenever the
    // parent changes. On a Database or XPath source this is pushed to the server.
    useEffect(() => {
        if (!childParent.filterable) {
            console.warn(`${name}: the child to parent reference is not filterable.`);
            return;
        }
        childSource.setFilter(
            selectedParent ? equals(association(childParent.id), literal(selectedParent)) : undefined
        );
    }, [name, childSource, childParent, selectedParent]);

    // Drop children belonging to the parent we just left.
    useEffect(() => {
        if (previousParent.current !== parentId) {
            previousParent.current = parentId;
            if (clearOnParentChange && !readOnly) {
                selection.setValue([]);
            }
        }
    }, [parentId, clearOnParentChange, readOnly, selection]);

    const children: ObjectItem[] = selectedParent && childSource.status === ValueStatus.Available
        ? childSource.items ?? []
        : [];

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) {
            return children;
        }
        return children.filter(item => text(childCaption.get(item)).toLowerCase().includes(needle));
    }, [children, childCaption, query]);

    const selectedIds = useMemo(
        () => new Set((selection.value ?? []).map(item => item.id)),
        [selection.value]
    );

    const commit = useCallback(
        (next: ObjectItem[]) => {
            selection.setValue(next);
            onChange?.canExecute && onChange.execute();
        },
        [selection, onChange]
    );

    const toggle = useCallback(
        (item: ObjectItem) => {
            const current = selection.value ?? [];
            commit(
                selectedIds.has(item.id)
                    ? current.filter(existing => existing.id !== item.id)
                    : [...current, item]
            );
        },
        [selection.value, selectedIds, commit]
    );

    const selectAll = useCallback(() => {
        const current = selection.value ?? [];
        const missing = visible.filter(item => !selectedIds.has(item.id));
        commit([...current, ...missing]);
    }, [selection.value, selectedIds, visible, commit]);

    const clearAll = useCallback(() => {
        const visibleIds = new Set(visible.map(item => item.id));
        commit((selection.value ?? []).filter(item => !visibleIds.has(item.id)));
    }, [selection.value, visible, commit]);

    const gridStyle = { "--hs-col": `${minColumnWidth}px` } as any;
    const loading = parentSource.status === ValueStatus.Loading || childSource.status === ValueStatus.Loading;

    return (
        <div className={`hierarchy-selector ${className}`} style={style} data-loading={loading}>
            <div className="hierarchy-selector__parent">
                {text(parentLabel) && (
                    <label className="control-label" htmlFor={`${name}-parent`}>
                        {text(parentLabel)}
                    </label>
                )}
                <select
                    id={`${name}-parent`}
                    className="form-control"
                    tabIndex={tabIndex}
                    disabled={readOnly}
                    value={parentId}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                        setParentId(event.target.value);
                        setQuery("");
                    }}
                >
                    <option value="">{text(parentPlaceholder)}</option>
                    {parents.map(item => (
                        <option key={item.id} value={item.id}>
                            {text(parentCaption.get(item))}
                        </option>
                    ))}
                </select>
            </div>

            {selectedParent && (
                <div className="hierarchy-selector__toolbar">
                    {showSearch && (
                        <input
                            type="text"
                            className="form-control hierarchy-selector__search"
                            value={query}
                            disabled={readOnly}
                            placeholder="Filter"
                            onChange={event => setQuery(event.target.value)}
                        />
                    )}
                    {showSelectAll && (
                        <div className="hierarchy-selector__actions">
                            <button type="button" className="btn btn-default btn-sm" disabled={readOnly || !visible.length} onClick={selectAll}>
                                Select all
                            </button>
                            <button type="button" className="btn btn-default btn-sm" disabled={readOnly || !selectedIds.size} onClick={clearAll}>
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!selectedParent ? (
                <p className="hierarchy-selector__empty">{text(emptyMessage)}</p>
            ) : !visible.length ? (
                <p className="hierarchy-selector__empty">
                    {children.length ? "Nothing matches that filter." : "This one has no options yet."}
                </p>
            ) : (
                <div className="hierarchy-selector__grid" style={gridStyle} role="group" aria-label={text(parentLabel)}>
                    {visible.map(item => {
                        const checked = selectedIds.has(item.id);
                        return (
                            <label
                                key={item.id}
                                className={`hierarchy-selector__option ${checked ? "is-selected" : ""}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={readOnly}
                                    onChange={() => toggle(item)}
                                />
                                <span>{text(childCaption.get(item))}</span>
                            </label>
                        );
                    })}
                </div>
            )}

            {showCount && selectedParent && (
                <div className="hierarchy-selector__footer">
                    <span>{selectedIds.size ? `${selectedIds.size} selected` : "Nothing selected"}</span>
                    {childSource.hasMoreItems && <span>Showing the first {childLimit}</span>}
                </div>
            )}
        </div>
    );
}
