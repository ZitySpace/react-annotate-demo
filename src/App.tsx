import React, { useEffect, useState } from "react";

import {
  Annotator,
  ImageData,
  BoxLabel,
  MaskLabel,
  PointLabel,
} from "@zityspace/react-annotate";

const responseHandlerTemplate = async (response: Response) => {
  const data = await response.json();

  if (response.status > 400 && response.status <= 500) {
    const err = data.detail ? data.detail : data;
    throw err;
  }

  return data;
};

const requestTemplate =
  (
    requestConstructor: Function,
    responseHandler: Function = responseHandlerTemplate,
    dataTransformer: Function | null = null
  ) =>
  async (...args: any[]) => {
    const { url, method, headers, body } = requestConstructor(...args);
    const headersFinal = headers || new Headers({ Accept: "application/json" });

    const request = new Request(url, {
      method: method,
      headers: headersFinal,
      body: body,
    });
    const response = await fetch(request);

    const data = await responseHandler(response);

    return dataTransformer ? dataTransformer(data) : data;
  };

const apiEndpoint =
  process.env.NODE_ENV === "development"
    ? process.env.REACT_APP_DEV_APIEndpoint
    : process.env.REACT_APP_PROD_APIEndpoint;

const getAnnotations = requestTemplate((task: string) => ({
  url: apiEndpoint + "/" + task,
  method: "GET",
}));

const App = () => {
  const [task, setTask] = useState<string | null>(null);
  const [imagesList, setImagesList] = useState<ImageData[]>([]);
  const taskOptions = [
    "detection",
    "segmentation",
    "keypoints",
    "detection+segmentation",
    "keypoints+segmentation",
  ];

  useEffect(() => {
    (async () => {
      try {
        const data = await getAnnotations(task);

        data.forEach(
          (img: any) =>
            (img.url = img.url.replace("http://images.cocodataset.org", ""))
        );

        if (task === "detection")
          data.forEach(
            (img: any) =>
              (img.annotations = img.annotations.map(
                (anno: any, id: number) => new BoxLabel({ ...anno, id })
              ))
          );

        if (task === "segmentation")
          data.forEach(
            (img: any) =>
              (img.annotations = img.annotations.map(
                (anno: any, id: number) => {
                  const { mask: paths_, category } = anno;
                  const paths = paths_.map((points: number[]) => ({
                    points: Array.from(
                      { length: points.length / 2 },
                      (_, i) => ({
                        x: points[2 * i],
                        y: points[2 * i + 1],
                      })
                    ),
                  }));
                  return new MaskLabel({
                    paths,
                    id,
                    category: category as string,
                  });
                }
              ))
          );

        if (task === "keypoints")
          data.forEach(
            (img: any) =>
              (img.annotations = img.annotations
                .map((anno: any) => {
                  const keypoints = anno.keypoints as number[];

                  return Array.from(
                    { length: keypoints.length / 3 },
                    (_, i) => ({
                      x: keypoints[3 * i],
                      y: keypoints[3 * i + 1],
                      visible: keypoints[3 * i + 2],
                      category: `kp-${i}`,
                    })
                  ).filter((p) => p.visible === 2);
                })
                .flat()
                .map((p: any, id: number) => new PointLabel({ ...p, id })))
          );

        if (task === "detection+segmentation")
          data.forEach(
            (img: any) =>
              (img.annotations = img.annotations
                .map((anno: any, id: number) => {
                  const { category, x, y, w, h, mask: paths_ } = anno;
                  const paths = paths_.map((points: number[]) => ({
                    points: Array.from(
                      { length: points.length / 2 },
                      (_, i) => ({
                        x: points[2 * i],
                        y: points[2 * i + 1],
                      })
                    ),
                  }));

                  return [
                    new BoxLabel({ x, y, w, h, category, id: 2 * id }),
                    new MaskLabel({ paths, category, id: 2 * id + 1 }),
                  ];
                })
                .flat())
          );

        if (task === "keypoints+segmentation")
          data.forEach(
            (img: any) =>
              (img.annotations = img.annotations
                .map((anno: any) => {
                  const { category, mask: paths_, keypoints } = anno;
                  const paths = paths_.map((points: number[]) => ({
                    points: Array.from(
                      { length: points.length / 2 },
                      (_, i) => ({
                        x: points[2 * i],
                        y: points[2 * i + 1],
                      })
                    ),
                  }));

                  return [
                    { category, paths, label: "Mask" },
                    ...Array.from({ length: keypoints.length / 3 }, (_, i) => ({
                      x: keypoints[3 * i],
                      y: keypoints[3 * i + 1],
                      visible: keypoints[3 * i + 2],
                      category: `kp-${i}`,
                      label: "Point",
                    })).filter((p) => p.visible === 2),
                  ];
                })
                .flat()
                .map((l: any, id: number) =>
                  l.label === "Mask"
                    ? new MaskLabel({ ...l, id })
                    : new PointLabel({ ...l, id })
                ))
          );

        setImagesList(data);
      } catch (err) {
        console.log(err instanceof Error ? err.message : (err as string));
      }
    })();
  }, [task]);

  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="w-full bg-gray-100 p-2 shadow-lg">
        <div className="md:hidden">
          <select
            id="tasks"
            name="tasks"
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            required
            defaultValue="placeholder"
            onChange={(evt) => setTask(evt.target.value)}
          >
            <option disabled hidden value="placeholder">
              Select a task
            </option>
            {taskOptions.map((task_) => (
              <option key={task_} value={task_}>
                {task_}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden md:flex space-x-4">
          {taskOptions.map((task_) => (
            <button
              type="button"
              key={task_}
              className={`
                ${
                  task === task_
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-500 hover:text-gray-700"
                } px-3 py-2 font-medium text-sm rounded-md
              `}
              onClick={() => setTask(task_)}
            >
              {task_}
            </button>
          ))}
        </div>
      </div>

      <Annotator
        imagesList={imagesList}
        initIndex={0}
        onSave={async (d: ImageData) => {
          console.log(d);
          return true;
        }}
        onError={(m: string, c: any) => {
          console.log(m, c);
        }}
        onAddCategory={async (c: string) => {
          console.log("add new category ", c);
          return true;
        }}
        onRenameCategory={async (o: string, n: string, t?: string) => {
          console.log(o, " -> ", n, " @ ", t);
          return true;
        }}
      />
    </div>
  );
};

export default App;
