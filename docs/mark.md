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

### create(Mark | { type: string; data?: any } | string): Mark;

### createSet(elements: any[] = []): Mark[];

### createProperties(attrs: any = {}): { type: string, data?: any};

### fromJSON(attrs: any): Mark;

<br>

## 方法

### toJSON(): {type: string, data: any};
