import { ClickAwayListener, Dialog, Popper, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { ColorKeys, DatepickerType, DateType, Period } from "../types";

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
        popoverDirection = "auto",
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
        disablePortal = false,
        zIndex
    } = props;

    // Refs
    const containerRef = useRef<HTMLDivElement | null>(null);

    // States
    const [firstDate, setFirstDate] = useState<Date>(
        startFrom && dateIsValid(startFrom) ? startFrom : new Date()
    );
    const [secondDate, setSecondDate] = useState<Date>(nextMonthBy(firstDate));
    const [period, setPeriod] = useState<Period>({ start: null, end: null });
    const [dayHover, setDayHover] = useState<DateType>(null);
    const [inputText, setInputText] = useState<string>("");
    const input = useRef<HTMLInputElement | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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

    const safePrimaryColor = useMemo<ColorKeys>(() => {
        return COLORS.includes(primaryColor) ? (primaryColor as ColorKeys) : DEFAULT_COLOR;
    }, [primaryColor]);

    const contextValues = useMemo(() => {
        return {
            asSingle,
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
            hideDatepicker: () => setAnchorEl(null),
            showDatepicker: (event: React.FocusEvent<HTMLElement>) =>
                setAnchorEl(event.currentTarget),
            i18n: i18n && i18n.length > 0 ? i18n : LANGUAGE,
            input,
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
            value
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
        setAnchorEl,
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
        firstGotoDate
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
        const defaultPopupClassName = "text-sm lg:text-xs 2xl:text-sm  w-fit p-1";
        if (typeof popupClassName === "function") {
            return popupClassName(defaultPopupClassName);
        }
        if (typeof popupClassName === "string" && popupClassName !== "") {
            return popupClassName;
        }
        return defaultPopupClassName;
    }, [popupClassName]);

    return (
        <DatepickerContext.Provider value={contextValues}>
            <div className={containerClassNameOverload} ref={containerRef}>
                <Input ref={input} />
                <Dialog
                    open={Boolean(anchorEl) && isMobile}
                    onClose={() => setAnchorEl(null)}
                    disableRestoreFocus
                    maxWidth="md"
                >
                    <div className={popupClassNameOverload}>
                        <div className="flex flex-col lg:flex-row max-h-[80vh] overflow-y-auto max-w-[80vw]">
                            {showShortcuts && <Shortcuts />}

                            <div className="flex items-stretch flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-1.5">
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
                </Dialog>

                <Popper
                    open={Boolean(anchorEl) && !isMobile}
                    anchorEl={anchorEl}
                    disablePortal={disablePortal}
                    keepMounted={false}
                    placement={popoverDirection}
                    sx={{ zIndex: zIndex }}
                >
                    <ClickAwayListener
                        onClickAway={(event: MouseEvent | TouchEvent) => {
                            if (
                                containerRef.current &&
                                containerRef.current.contains(event.target as Node)
                            ) {
                                return;
                            }
                            if (anchorEl) {
                                setAnchorEl(null);
                            }
                        }}
                    >
                        <div className="shadow-sm border border-gray-300 px-1 py-0.5 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 rounded-lg">
                            <div className={popupClassNameOverload}>
                                <div className="flex flex-col lg:flex-row max-h-[80vh] overflow-y-auto max-w-[80vw]">
                                    {showShortcuts && <Shortcuts />}

                                    <div className="flex items-stretch flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-1.5">
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
                            </div>

                            {showFooter && <Footer />}
                        </div>
                    </ClickAwayListener>
                </Popper>
            </div>
        </DatepickerContext.Provider>
    );
};

export default Datepicker;
