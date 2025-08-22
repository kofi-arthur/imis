import styles from '../styles/components/dropdown.module.css'

import { useState, useRef, useEffect } from 'react';

export const Dropdown = ({ options = [], selected, onSelect, placeholder = 'Select an option' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef();

    const handleSelect = (option) => {
        onSelect(option);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className={styles.dropdown}>
            <div className={styles.dropdownHeader} onClick={() => setIsOpen(prev => !prev)}>
                {selected || placeholder}
                <i className="fal fa-chevron-down" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}></i>
            </div>
            {isOpen && (
                <menu className={styles.dropdownMenu}>
                    {options.map((option, idx) => (
                        <div className={styles.option} style={{ fontWeight: selected === option ? '600' : '' }} key={idx} onClick={() => handleSelect(option)}>
                            {selected === option && <i className="far fa-check"></i>}
                            <p>{option}</p>
                        </div>
                    ))}
                </menu>
            )}
        </div>
    );
};
