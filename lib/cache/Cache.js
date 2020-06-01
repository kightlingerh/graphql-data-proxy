import { isNonEmpty } from 'fp-ts/lib/Array';
import { left, right } from 'fp-ts/lib/Either';
import { validate } from './validate';
export function cache(c) {
    return (deps) => {
        return (r) => {
            const errors = validate(c)(r);
            if (isNonEmpty(errors)) {
                return left(errors);
            }
            else {
                const store = c.store({ persist: deps.persist, ofRef: deps.ofRef, path: deps.id || 'root' });
                return right({
                    write: store.write,
                    read: (variables) => store.read(r)(variables),
                    toRefs: (variables) => store.toRefs(r)(variables),
                    toRef: (variables) => store.toRef(r)(variables)
                });
            }
        };
    };
}
