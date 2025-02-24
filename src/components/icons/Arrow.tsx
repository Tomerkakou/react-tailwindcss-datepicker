import { forwardRef, ReactNode } from "react";

interface Props {
    children?: ReactNode;
    hide?: boolean;
}

const Arrow = forwardRef<HTMLDivElement, Props>((props, ref) => {
    return (
        <div
            {...props}
            ref={ref}
            className={
                props.hide
                    ? "hidden"
                    : "absolute z-20 h-4 w-4 rotate-45 mt-0.5 ms-[1.2rem] border-l border-t border-gray-300 bg-white dark:bg-slate-800 dark:border-slate-600"
            }
        />
    );
});

Arrow.displayName = "Arrow";

export default Arrow;
