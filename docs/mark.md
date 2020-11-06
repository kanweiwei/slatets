# Mark

标记

## 属性

```
 Mark {
     type: string;
     data: Data
 }
```

### `readonly` object: 'mark';

<br>

## 静态方法

### create

`create(Mark | { type: string; data?: any } | string): Mark`

### createSet

`createSet(elements: any[] = []): Mark[];`

### createProperties

`createProperties(attrs: any = {}): { type: string, data?: any}`

### fromJSON

`fromJSON(attrs: any): Mark`

<br>

## 实例方法

### toJSON

`toJSON(): {type: string, data: any}`
