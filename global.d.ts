declare function assertNever(value: never): never;

// eslint-disable-next-line @typescript-eslint/ban-types
type Prettify<T> = T extends {}
  ? T extends infer Obj
    ? T extends Date
      ? Date
      : // eslint-disable-next-line @typescript-eslint/ban-types
        { [Key in keyof Obj]: Prettify<Obj[Key]> } & {}
    : never
  : T;

type NullablePartial<
  T,
  NK extends keyof T = { [K in keyof T]: null extends T[K] ? K : never }[keyof T],
  NP = Partial<Pick<T, NK>> & Pick<T, Exclude<keyof T, NK>>,
> = { [K in keyof NP]: NP[K] };

type PartialWithId<T> = Partial<T> & { id: string | number };
