import { User } from '../types';

export const sortBySurname = (a: User, b: User) => {
    const getSurname = (name: string) => {
        const parts = name.trim().split(' ');
        // Assuming "Firstname Surname1 Surname2"
        // If there's only one name, return it.
        // If there are multiple, return the second part.
        return parts.length > 1 ? parts[1].toLowerCase() : parts[0].toLowerCase();
    };
    return getSurname(a.name).localeCompare(getSurname(b.name));
};
