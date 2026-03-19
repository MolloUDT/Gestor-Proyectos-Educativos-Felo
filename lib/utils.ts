import { User } from '../types';

export const sortBySurname = (a: User, b: User) => {
    return a.lastName.toLowerCase().localeCompare(b.lastName.toLowerCase());
};
