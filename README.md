# Intro

This is a code first, type safe GraphQL library. It is not yet available on npm / yarn but will be soon.

**Note**. [`fp-ts`](https://github.com/gcanti/fp-ts) and [`io-ts`](https://github.com/gcanti/io-ts) are peer dependencies for `graphql-data-proxy`

## WIP
This is a work in progress. I started `graphql-data-proxy` because existing client side graphql libraries left a lot to be
desired in terms of type safety and cache performance.

## Goals
* Written in Typescript and 100% type safe from its external api
* Have declarative mechanisms to define a GraphQL schema and then derive requests from that schema
* Be able to extract `Eq`, `Decoder`, `Encoder`, and `Guard` instances from schema / request definitions
* Have a high performance, reactive cache built on top of vue 3 primitives that supports

## Simple Usage

```typescript
import * as N from 'graphql-data-proxy/lib/node';

const PersonNode = N.type('Person', {
	firstName: N.staticString,
    lastName: N.staticString,
})

interface Person extends N.TypeOf<typeof PersonNode> {}
// equivalent to interface Person { firstName: string, lastName: string }

const Schema = N.type('Query', {
	person: PersonNode
})

```
