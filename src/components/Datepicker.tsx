"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import Calendar from "../components/Calendar";
import Footer from "../components/Footer";
import Input from "../components/Input";
import Shortcuts from "../components/Shortcuts";
import {
    COLORS,
    DATE_FORMAT,
    DEFAULT_COLOR,
    DEFAULT_DATE_LOOKING,
    DEFAULT_SEPARATOR,
    LANGUAGE,
    START_WEEK
} from "../constants";
import DatepickerContext from "../contexts/DatepickerContext";
import useOnClickOutside, { useMediaQuery } from "../hooks";
import {
    dateFormat,
    dateIsAfter,
    dateIsSameOrAfter,
    dateIsSameOrBefore,
    dateIsValid,
    dateUpdateMonth,
    dateUpdateYear,
    firstDayOfMonth,
    nextMonthBy,
    previousMonthBy
} from "../libs/date";
import { Period, DatepickerType, ColorKeys, DateType } from "../types";

import Arrow from "./icons/Arrow";
import CloseIcon from "./icons/CloseIcon";
import VerticalDash from "./VerticalDash";

const Datepicker = (props: DatepickerType) => {
    // Props
    const {
        asSingle = false,
        classNames,
        configs,
        containerClassName = null,
        dateLooking = DEFAULT_DATE_LOOKING,
        disabledDates = null,
        disabled = false,
        displayFormat = DATE_FORMAT,
        i18n = LANGUAGE,
        inputClassName = null,
        inputId,
        inputName,
        minDate,
        maxDate,
        onChange,
        placeholder = null,
        popupClassName = null,
        popoverDirection,
        primaryColor = DEFAULT_COLOR,
        separator = DEFAULT_SEPARATOR,
        showFooter = false,
        showShortcuts = false,
        startFrom = null,
        startWeekOn = START_WEEK,
        readOnly = false,
        required = false,
        toggleClassName = null,
        toggleIcon,
        useRange = true,
        value = null,
        appendToBody = true
    } = props;

    // Refs
    const containerRef = useRef<HTMLDivElement | null>(null);
    const calendarContainerRef = useRef<HTMLDivElement | null>(null);
    const arrowRef = useRef<HTMLDivElement | null>(null);
    const backdropRef = useRef<HTMLDivElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);

    // States
    const [firstDate, setFirstDate] = useState<Date>(
        startFrom && dateIsValid(startFrom) ? startFrom : new Date()
    );
    const [secondDate, setSecondDate] = useState<Date>(nextMonthBy(firstDate));
    const [period, setPeriod] = useState<Period>({ start: null, end: null });
    const [dayHover, setDayHover] = useState<DateType>(null);
    const [inputText, setInputText] = useState<string>("");
    const [input, setInput] = useState<HTMLInputElement | null>(null);
    const isSmallScreen = useMediaQuery("(max-width: 639px)");
    const [mounted, setMounted] = useState<boolean>(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [trigger, setTrigger] = useState();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Custom Hooks
    useOnClickOutside(containerRef.current, event => {
        const container = containerRef.current;
        const calendar = calendarContainerRef.current;
        if (calendar && calendar.contains(event?.target as Node)) return;
        if (container) hideDatepicker();
    });

    // Hide datepicker
    const hideDatepicker = useCallback(() => {
        const div = calendarContainerRef.current;
        const arrow = arrowRef.current;
        const modal = modalRef.current;
        const backdrop = backdropRef.current;
        if (arrow && div && modal && backdrop && div.classList.contains("block")) {
            modal.classList.add("hidden");
            backdrop.classList.add("hidden");
            div.classList.remove("block");
            div.classList.remove("translate-y-0");
            div.classList.remove("opacity-1");
            div.classList.add("opacity-0");
            setTimeout(() => {
                div.classList.remove("bottom-full");
                div.classList.add("hidden");
                div.classList.add("mb-2.5");
                div.classList.add("mt-2.5");
                arrow.classList.remove("-bottom-2");
                arrow.classList.remove("border-r");
                arrow.classList.remove("border-b");
                arrow.classList.add("border-l");
                arrow.classList.add("border-t");
            }, 300);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted]);

    /** First Calendar Navigation */
    const firstGotoDate = useCallback(
        (date: Date) => {
            if (dateIsSameOrAfter(date, secondDate, "date")) {
                setSecondDate(nextMonthBy(date));
            }
            setFirstDate(date);
        },
        [secondDate]
    );

    const previousMonthFirst = useCallback(() => {
        setFirstDate(previousMonthBy(firstDate));
    }, [firstDate]);

    const nextMonthFirst = useCallback(() => {
        firstGotoDate(nextMonthBy(firstDate));
    }, [firstDate, firstGotoDate]);

    const changeFirstMonth = useCallback(
        (month: number) => {
            firstGotoDate(dateUpdateMonth(firstDate, month - 1));
        },
        [firstDate, firstGotoDate]
    );

    const changeFirstYear = useCallback(
        (year: number) => {
            firstGotoDate(dateUpdateYear(firstDate, year));
        },
        [firstDate, firstGotoDate]
    );

    /** Second Calendar Navigation */
    const secondGotoDate = useCallback(
        (date: Date) => {
            if (dateIsSameOrBefore(date, firstDate, "date")) {
                setFirstDate(previousMonthBy(date));
            }
            setSecondDate(date);
        },
        [firstDate]
    );

    const previousMonthSecond = useCallback(() => {
        secondGotoDate(previousMonthBy(secondDate));
    }, [secondDate, secondGotoDate]);

    const nextMonthSecond = useCallback(() => {
        setSecondDate(nextMonthBy(secondDate));
    }, [secondDate]);

    const changeSecondMonth = useCallback(
        (month: number) => {
            secondGotoDate(dateUpdateMonth(secondDate, month - 1));
        },
        [secondDate, secondGotoDate]
    );

    const changeSecondYear = useCallback(
        (year: number) => {
            secondGotoDate(dateUpdateYear(secondDate, year));
        },
        [secondDate, secondGotoDate]
    );

    // UseEffects
    useEffect(() => {
        if (value && value.startDate && value.endDate) {
            if (dateIsSameOrBefore(value.startDate, value.endDate, "date")) {
                setPeriod({
                    start: value.startDate,
                    end: value.endDate
                });
                setInputText(
                    `${dateFormat(value.startDate, displayFormat, i18n)}${
                        asSingle
                            ? ""
                            : ` ${separator} ${dateFormat(value.endDate, displayFormat, i18n)}`
                    }`
                );
            }
        }
        if (value && value.startDate === null && value.endDate === null) {
            setPeriod({ start: null, end: null });
            setInputText("");
        }
    }, [asSingle, value, displayFormat, separator, i18n]);

    useEffect(() => {
        if (startFrom && dateIsValid(startFrom)) {
            const startDate = value?.startDate;
            const endDate = value?.endDate;
            if (startDate && dateIsValid(startDate)) {
                setFirstDate(startDate);
                if (!asSingle) {
                    if (
                        endDate &&
                        dateIsValid(endDate) &&
                        dateIsAfter(firstDayOfMonth(endDate), startDate, "date")
                    ) {
                        setSecondDate(endDate);
                    } else {
                        setSecondDate(nextMonthBy(startDate));
                    }
                }
            } else {
                setFirstDate(startFrom);
                setSecondDate(nextMonthBy(startFrom));
            }
        }
    }, [asSingle, startFrom, value]);

    // This effect originally only tried to handle arrow alignment if not appended to body;
    // We'll keep some minimal logic to see if we need to shift arrow for left vs right positioning.
    useEffect(() => {
        const container = containerRef.current;
        const calendarContainer = calendarContainerRef.current;
        const arrow = arrowRef.current;

        if (container && calendarContainer && arrow) {
            const detail = container.getBoundingClientRect();
            const screenCenter = window.innerWidth / 2;
            const containerCenter = (detail.right - detail.x) / 2 + detail.x;
            if (containerCenter > screenCenter) {
                arrow.classList.add("right-0");
                arrow.classList.add("mr-3.5");
                calendarContainer.classList.add("right-0");
            }
        }
    }, [mounted]);

    const safePrimaryColor = useMemo<ColorKeys>(() => {
        return COLORS.includes(primaryColor) ? (primaryColor as ColorKeys) : DEFAULT_COLOR;
    }, [primaryColor]);

    const contextValues = useMemo(() => {
        return {
            arrowContainer: arrowRef,
            asSingle,
            calendarContainer: calendarContainerRef,
            changeDatepickerValue: onChange,
            changeDayHover: (newDay: DateType) => setDayHover(newDay),
            changeInputText: (newText: string) => setInputText(newText),
            changePeriod: (newPeriod: Period) => setPeriod(newPeriod),
            classNames,
            configs,
            containerClassName,
            dateLooking,
            dayHover,
            disabled,
            disabledDates,
            displayFormat,
            hideDatepicker,
            i18n: i18n && i18n.length > 0 ? i18n : LANGUAGE,
            input,
            setInput: (value: HTMLInputElement | null) => setInput(value),
            inputClassName,
            inputId,
            inputName,
            inputText,
            maxDate,
            minDate,
            onChange,
            period,
            placeholder,
            popoverDirection,
            primaryColor: safePrimaryColor,
            readOnly,
            required,
            separator,
            showFooter,
            startWeekOn: startWeekOn || START_WEEK,
            toggleClassName,
            toggleIcon,
            updateFirstDate: (newDate: Date) => firstGotoDate(newDate),
            value,
            appendToBody,
            mounted,
            modal: modalRef,
            backdrop: backdropRef
        };
    }, [
        minDate,
        maxDate,
        i18n,
        asSingle,
        onChange,
        classNames,
        configs,
        containerClassName,
        dateLooking,
        dayHover,
        disabled,
        disabledDates,
        displayFormat,
        hideDatepicker,
        input,
        inputClassName,
        inputId,
        inputName,
        inputText,
        period,
        placeholder,
        popoverDirection,
        safePrimaryColor,
        readOnly,
        required,
        separator,
        showFooter,
        startWeekOn,
        toggleClassName,
        toggleIcon,
        value,
        firstGotoDate,
        appendToBody,
        mounted,
        modalRef,
        backdropRef
    ]);

    // Dynamically build container class name
    const containerClassNameOverload = useMemo(() => {
        const defaultContainerClassName = "relative w-full text-gray-700";
        if (typeof containerClassName === "function") {
            return containerClassName(defaultContainerClassName);
        }
        if (typeof containerClassName === "string" && containerClassName !== "") {
            return containerClassName;
        }
        return defaultContainerClassName;
    }, [containerClassName]);

    // Dynamically build popup class name
    const popupClassNameOverload = useMemo(() => {
        const defaultPopupClassName =
            "transition-all ease-out duration-300 absolute z-10 mt-[1px] text-sm lg:text-xs 2xl:text-sm  opacity-0 hidden w-fit";
        if (typeof popupClassName === "function") {
            return popupClassName(defaultPopupClassName);
        }
        if (typeof popupClassName === "string" && popupClassName !== "") {
            return popupClassName;
        }
        return defaultPopupClassName;
    }, [popupClassName]);

    /**
     * Decide the position for the calendar if `appendToBody` is true.
     * We also handle up/down positioning if `popoverDirection` is provided.
     */
    const calculatePosition = useCallback(() => {
        if (!appendToBody || !input) return {};

        const inputRect = input.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        const container = containerRef.current;
        const arrow = arrowRef.current;

        // By default, place below (down).
        let style: React.CSSProperties = {
            position: "fixed",
            top: inputRect.bottom + scrollTop + 1,
            left: inputRect.left + scrollLeft,
            zIndex: 1000
        };

        setTimeout(() => setTrigger({}), 0);

        // Check direction
        if (popoverDirection === "up") {
            // Place above
            style = {
                position: "fixed",
                // The "bottom" css property is from the *bottom* of the viewport,
                // so let's compute: window.innerHeight - inputRect.top => distance from top of input to bottom of viewport
                bottom: window.innerHeight - inputRect.top - scrollTop + 1,
                left: inputRect.left + scrollLeft,
                zIndex: 1000
            };
        } else if (popoverDirection === "down") {
            // Force down — can override any "smart" logic here
            style = {
                position: "fixed",
                top: inputRect.bottom + scrollTop + 1,
                left: inputRect.left + scrollLeft,
                zIndex: 1000
            };
        } else {
            // If popoverDirection is not set, you can keep the old "auto" logic
            // For example:
            // You could also check if there's enough space below or not.
            // If not enough space below, place it up. (similar to the logic in `Input`.)
            // e.g.,
            // const spaceBelow = window.innerHeight - inputRect.bottom;
            // if (spaceBelow < 300) {
            //   style = {
            //     position: "fixed",
            //     bottom: window.innerHeight - inputRect.top - scrollTop + 1,
            //     left: inputRect.left + scrollLeft,
            //     zIndex: 1000
            //   };
            // }
        }

        const containerCenter =
            Math.floor((inputRect.right - inputRect.left) / 2 + inputRect.left) + 1;
        const screenCenter = Math.floor(window.innerWidth / 2);

        // Place it left or right if near the screen's edge
        if (container && arrow) {
            if (containerCenter > screenCenter) {
                arrow.classList.add("right-0");
                arrow.classList.add("mr-3.5");
                style.right = window.innerWidth - inputRect.right;
                style.left = undefined; // remove left if we use right
            }
        }

        if (isSmallScreen) {
            return {
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
                height: "100vh",
                width: "100vw"
            } as React.CSSProperties;
        }

        return style as React.CSSProperties;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appendToBody, input, popoverDirection, mounted, isSmallScreen, arrowRef, containerRef]);

    return (
        <DatepickerContext.Provider value={contextValues}>
            <div className={containerClassNameOverload} ref={containerRef}>
                <Input />
                {mounted &&
                    createPortal(
                        <div
                            className={popupClassNameOverload}
                            ref={calendarContainerRef}
                            style={calculatePosition()}
                        >
                            <Arrow ref={arrowRef} />
                            <div
                                ref={backdropRef}
                                className={
                                    isSmallScreen ? "fixed inset-0 bg-black bg-opacity-50 z-40" : ""
                                }
                            />
                            <div
                                ref={modalRef}
                                className={
                                    isSmallScreen
                                        ? "fixed inset-0 z-50 flex items-center justify-center overflow-auto p-3"
                                        : ""
                                }
                            >
                                <div className="mt-2.5 shadow-sm border border-gray-300 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 rounded-lg w-fit p-3">
                                    {isSmallScreen && (
                                        <div className="flex justify-end p-1 w-full">
                                            <button
                                                onClick={hideDatepicker}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                <CloseIcon className="w-6 h-6" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex flex-col lg:flex-row py-2 max-h-[80vh] overflow-y-auto max-w-[80vw]">
                                        {showShortcuts && <Shortcuts />}

                                        <div
                                            className={`flex items-stretch flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-1.5 ${
                                                showShortcuts ? "md:pl-1" : "md:pl-1"
                                            } pr-1 lg:pr-1`}
                                        >
                                            <Calendar
                                                date={firstDate}
                                                onClickPrevious={previousMonthFirst}
                                                onClickNext={nextMonthFirst}
                                                changeMonth={changeFirstMonth}
                                                changeYear={changeFirstYear}
                                                minDate={minDate}
                                                maxDate={maxDate}
                                            />

                                            {useRange && (
                                                <>
                                                    <div className="flex items-center">
                                                        <VerticalDash />
                                                    </div>

                                                    <Calendar
                                                        date={secondDate}
                                                        onClickPrevious={previousMonthSecond}
                                                        onClickNext={nextMonthSecond}
                                                        changeMonth={changeSecondMonth}
                                                        changeYear={changeSecondYear}
                                                        minDate={minDate}
                                                        maxDate={maxDate}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {showFooter && <Footer />}
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
            </div>
        </DatepickerContext.Provider>
    );
};

export default Datepicker;
