# Demo app of [@zityspace/react-annotate](https://github.com/ZitySpace/react-annotate) library

![react-annotate-demo](screenshot.jpg)


Go to this [Vercel link](https://react-annotate-demo.vercel.app/) to play with the demo. On the top bar you can select different task to try preview and modify the annotations.


## Setup

You need to implement the logic of hosting the annotations, it can be a backend api server, or some local files. Based on that, you may
also need to apply some transformations to transform annotations into the input format react-annotate library accepts.

For example, we use a backend api service ([repo](https://github.com/ZitySpace/react-annotate-demo-backend), openapi [docs](https://react-annotate-demo-backend.vercel.app/docs)) to host the annotations for this demo. The data format `Annotator` class accepts is:

```typescript
const imagesList: ImageData[] = ...
```

where `ImageData` is

```typescript
interface ImageData {
  name: string;
  width?: number;
  height?: number;
  annotations: Label[];
  url?: string;
  [k: string]: unknown;
}
```

`react-annotate` library supports different types of `Label`: `PointLabel`, `LineLabel`, `BoxLabel`, `PolylineLabel`, `MaskLabel` which are subclasses of `Label`. The fields that are required to contruct each type of `Label` are

```typescript
// x: number, y: number, id: number, category: string ...
const aPointLabel = new PointLabel({
    x,
    y,
    category,
    id
})

const aLineLabel = new LineLabel({
    x1,
    y1,
    x2,
    y2,
    category,
    id
})

const aBoxLabel = new BoxLabel({
    x,
    y,
    w,
    h,
    category,
    id
})

// paths: {x: number; y: number}[][]
// Why it is 2D paths instead of 1D path?
// We want to support advanced editing that one Polyline can be break into
// multiple sub-polylines as intermediate state and in the end get connected
// and merged back as a single polyline
const aPolylineLabel = new PolylineLabel({
    paths,
    category,
    id
})

// paths: { points: {x: number; y: number}[]; closed?: boolean; hole?: boolean }[]
// The simplest mask can be seemed as one closed path. A mask with holes can be
// seemed as multiple paths with some of them hole = true. Like PolylineLabel, a
// mask (or closed path) can also be break into multiple open paths as intermediate
// state and in the end get connected and merged back as closed paths.
const aMaskLabel = new MaskLabel({
    paths,
    category,
    id
})

```

Check the `task` dependant effect in `src/App.tsx` as reference to know how to transform raw annotation data to `Label`s. Once `imagesList` is ready, you can pass it into the `Annotator` class which has such props:

```typescript
{
  imagesList: ImageData[];
  initIndex?: number;
  categories?: string[];
  getImage?: (imageName: string) => Promise<string> | string;
  onSave: (curImageData: ImageData) => Promise<boolean> | boolean;
  onError?: (message: string, context?: any) => void;
  onAddCategory: (category: string) => Promise<boolean> | boolean;
  onRenameCategory: (
    oldCategory: string,
    newCategory: string,
    timestamp?: string
  ) => Promise<boolean> | boolean;
}
```

*Note: you can either specify url for each image, or pass in a `getImage` function typically using the image name to request the image blob and return `URL.createObjectURL(imageBlob)`.*

*Note: when going the prev/next image and if current image has been modified, it will trigger onSave(); when adding a new category or renaming a category, it will trigger onAddCategory() and onRenameCategory(). It is your responsibility to implement these logic to persist the changes.*

*Note: it is recommended to pass in `categorie` of the whole dataset here. Otherwise it will be infered from imagesList, which usually is just a batch of annotations thus the infered `categories` is not complete.*


## How to annotate
In simple words, there are `Preview`, `Draw` and `Edit` modes, click on the bottom button bar, click on the canvas objects, click on category or ids will switch between these modes. Refer to `react-annotate` [docs](https://github.com/ZitySpace/react-annotate) for details about how to interact with different types of `Label`.
