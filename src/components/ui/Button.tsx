import React from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading = false, fullWidth = false, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={clsx(
                    styles.button,
                    styles[variant],
                    styles[size],
                    {
                        [styles.fullWidth]: fullWidth,
                        [styles.loading]: isLoading,
                    },
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && (
                    <span className={styles.spinnerWrapper}>
                        <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle className={styles.spinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className={styles.spinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </span>
                )}
                <span className={clsx({ [styles.hiddenContent]: isLoading })}>{children}</span>
            </button>
        );
    }
);

Button.displayName = 'Button';
