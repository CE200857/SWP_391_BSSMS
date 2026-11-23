import { useId, useMemo, useState } from "react";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import "./ManagerSearchFilter.css";

function getValue(row, field) {
    const value = field.getValue ? field.getValue(row) : row?.[field.key];
    return value == null ? "" : String(value).trim();
}

function emptyFilters(fields) {
    return Object.fromEntries(fields.map((field) => [
        field.key,
        field.type === "date" ? { from: "", to: "" } : [],
    ]));
}

export function filterListRows(rows, fields, query, appliedFilters) {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
    const filterFields = fields.filter((field) => field.filterable !== false);
    const searchFields = fields.filter((field) => field.searchable !== false);

    return rows.filter((row) => {
        const matchesQuery = !normalizedQuery || searchFields.some((field) => {
            const value = getValue(row, field);
            const label = field.formatValue ? field.formatValue(value) : value;
            return value.toLocaleLowerCase("vi-VN").includes(normalizedQuery) ||
                String(label ?? "").toLocaleLowerCase("vi-VN").includes(normalizedQuery);
        });
        if (!matchesQuery) return false;

        return filterFields.every((field) => {
            const value = getValue(row, field);
            const selected = appliedFilters[field.key];
            if (field.type === "date") {
                if (!selected?.from && !selected?.to) return true;
                const date = value.slice(0, 10);
                return (!selected.from || date >= selected.from) &&
                    (!selected.to || date <= selected.to);
            }
            return !selected?.length || selected.includes(value);
        });
    });
}

export function useManagerSearchFilter(rows, fields, placeholder = "Search...") {
    const filterTitleId = useId();
    const [query, setQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState(() => emptyFilters(fields));
    const [draftFilters, setDraftFilters] = useState(() => emptyFilters(fields));
    const [optionQueries, setOptionQueries] = useState({});
    const filterFields = fields.filter((field) => field.filterable !== false);

    const options = useMemo(() => Object.fromEntries(
        filterFields
            .filter((field) => field.type !== "date")
            .map((field) => [
                field.key,
                [...new Set(rows.map((row) => getValue(row, field)).filter(Boolean))]
                    .sort((a, b) => a.localeCompare(b, "vi")),
            ]),
    ), [filterFields, rows]);

    const filteredRows = useMemo(() => {
        return filterListRows(rows, fields, query, appliedFilters);
    }, [appliedFilters, fields, query, rows]);

    const activeFilterCount = filterFields.reduce((count, field) => {
        const selected = appliedFilters[field.key];
        if (field.type === "date") {
            return count + Number(Boolean(selected?.from)) + Number(Boolean(selected?.to));
        }
        return count + (selected?.length ?? 0);
    }, 0);

    const openFilters = () => {
        setDraftFilters(Object.fromEntries(filterFields.map((field) => [
            field.key,
            field.type === "date"
                ? { ...appliedFilters[field.key] }
                : [...(appliedFilters[field.key] ?? [])],
        ])));
        setOptionQueries({});
        setShowFilters(true);
    };

    const toggleOption = (fieldKey, option) => {
        setDraftFilters((current) => {
            const selected = current[fieldKey] ?? [];
            return {
                ...current,
                [fieldKey]: selected.includes(option)
                    ? selected.filter((item) => item !== option)
                    : [...selected, option],
            };
        });
    };

    const clearDraftFilters = () => setDraftFilters(emptyFilters(filterFields));

    const toolbar = (
        <>
            <InputGroup className="manager-search-filter">
                <InputGroup.Text className="manager-search-filter-icon">
                    <i className="bi bi-search" aria-hidden="true" />
                </InputGroup.Text>
                <Form.Control
                    type="search"
                    aria-label="Search"
                    placeholder={placeholder}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />
                <Button
                    variant="outline-secondary"
                    className={`manager-search-filter-trigger${activeFilterCount ? " is-active" : ""}`}
                    aria-label="Open filters"
                    aria-haspopup="dialog"
                    onClick={openFilters}
                >
                    <i className="bi bi-sliders" aria-hidden="true" />
                    <span className="d-none d-sm-inline">Filter</span>
                    {activeFilterCount > 0 && (
                        <span className="manager-search-filter-count">{activeFilterCount}</span>
                    )}
                </Button>
            </InputGroup>
            <Modal
                show={showFilters}
                onHide={() => setShowFilters(false)}
                centered
                scrollable
                dialogClassName="manager-search-filter-modal"
                aria-labelledby={filterTitleId}
            >
                <Modal.Header closeButton>
                    <Modal.Title id={filterTitleId}>Filter options</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {filterFields.map((field) => {
                        if (field.type === "date") {
                            const range = draftFilters[field.key] ?? { from: "", to: "" };
                            return (
                                <section className="manager-search-filter-section" key={field.key}>
                                    <h3>{field.label}</h3>
                                    <div className="manager-search-filter-date-range">
                                        <Form.Group>
                                            <Form.Label>From date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={range.from}
                                                max={range.to || undefined}
                                                onChange={(event) => setDraftFilters((current) => ({
                                                    ...current,
                                                    [field.key]: {
                                                        ...(current[field.key] ?? { from: "", to: "" }),
                                                        from: event.target.value,
                                                    },
                                                }))}
                                            />
                                        </Form.Group>
                                        <Form.Group>
                                            <Form.Label>To date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={range.to}
                                                min={range.from || undefined}
                                                onChange={(event) => setDraftFilters((current) => ({
                                                    ...current,
                                                    [field.key]: {
                                                        ...(current[field.key] ?? { from: "", to: "" }),
                                                        to: event.target.value,
                                                    },
                                                }))}
                                            />
                                        </Form.Group>
                                    </div>
                                </section>
                            );
                        }

                        const fieldOptions = options[field.key] ?? [];
                        const optionQuery = (optionQueries[field.key] ?? "").toLocaleLowerCase("vi-VN");
                        const visibleOptions = fieldOptions.filter((option) =>
                            option.toLocaleLowerCase("vi-VN").includes(optionQuery),
                        );
                        return (
                            <section className="manager-search-filter-section" key={field.key}>
                                <h3>{field.label}</h3>
                                {fieldOptions.length > 8 && (
                                    <Form.Control
                                        className="manager-search-filter-options-search"
                                        type="search"
                                        aria-label={`Search ${field.label.toLocaleLowerCase("vi-VN")}`}
                                        placeholder={`Search ${field.label.toLocaleLowerCase("vi-VN")}...`}
                                        value={optionQueries[field.key] ?? ""}
                                        onChange={(event) => setOptionQueries((current) => ({
                                            ...current,
                                            [field.key]: event.target.value,
                                        }))}
                                    />
                                )}
                                {visibleOptions.length ? (
                                    <div className="manager-search-filter-options">
                                        {visibleOptions.map((option) => (
                                            <label className="manager-search-filter-option" key={option}>
                                                <input
                                                    type="checkbox"
                                                    checked={(draftFilters[field.key] ?? []).includes(option)}
                                                    onChange={() => toggleOption(field.key, option)}
                                                />
                                                <span>{field.formatValue ? field.formatValue(option) : option}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="manager-search-filter-empty">No options available.</p>
                                )}
                            </section>
                        );
                    })}
                    {!filterFields.length && (
                        <p className="manager-search-filter-empty mb-0">
                            This page has no extra filter fields yet.
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={clearDraftFilters}>
                        Reset
                    </Button>
                    <Button
                        onClick={() => {
                            setAppliedFilters(draftFilters);
                            setShowFilters(false);
                        }}
                    >
                        Apply
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );

    return { filteredRows, toolbar, query, setQuery, activeFilterCount };
}
