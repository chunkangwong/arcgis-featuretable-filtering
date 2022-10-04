require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/FeatureTable",
  "esri/widgets/Expand",
  "esri/rest/support/TopFeaturesQuery",
  "esri/rest/support/TopFilter",
], (
  Map,
  MapView,
  FeatureLayer,
  FeatureTable,
  Expand,
  TopFeaturesQuery,
  TopFilter
) => {
  const fieldInfos = [
    {
      fieldName: "TOTAL",
      label: "Total visits",
      format: { digitSeparator: true },
    },
    {
      fieldName: "F2018",
      label: "2018",
      format: { digitSeparator: true },
    },
    {
      fieldName: "F2019",
      label: "2019",
      format: { digitSeparator: true },
    },
    {
      fieldName: "F2020",
      label: "2020",
      format: { digitSeparator: true },
    },
  ];
  const featureLayer = new FeatureLayer({
    url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/US_National_Parks_Annual_Visitation/FeatureServer/0",
    outFields: ["*"],
    popupTemplate: {
      title: "{Park}",
      content: [
        {
          type: "fields",
          fieldInfos: fieldInfos,
        },
      ],
    },
  });

  const map = new Map({
    basemap: "topo-vector",
    layers: [featureLayer],
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-120, 45],
    zoom: 3,
  });

  const infoDiv = document.getElementById("infoDiv");
  view.ui.add(
    new Expand({
      view: view,
      content: infoDiv,
      expandIconClass: "esri-icon-layer-list",
      expanded: true,
    }),
    "top-right"
  );

  (async () => {
    const layerView = await view.whenLayerView(featureLayer);
    const featureTable = new FeatureTable({
      layer: featureLayer,
      view: view,
      container: "tableDiv",
      highlightOnRowSelectEnabled: false,
      tableTemplate: {
        columnTemplates: [
          {
            fieldName: "Park",
            label: "Park",
          },
          {
            fieldName: "State",
            label: "State",
          },
          {
            fieldName: "TOTAL",
            label: "Total visits",
            format: { digitSeparator: true },
          },
          {
            fieldName: "F2018",
            label: "2018",
            format: { digitSeparator: true },
          },
          {
            fieldName: "F2019",
            label: "2019",
            format: { digitSeparator: true },
          },
          {
            fieldName: "F2020",
            label: "2020",
            format: { digitSeparator: true },
          },
        ],
      },
    });

    // Assign event listener to the three filter buttons
    ["2018", "2019", "2020"].forEach((year) => {
      const filterButton = document.querySelector(`#filter${year}`);
      filterButton.addEventListener("click", async (event) => {
        // Style the three buttons accordingly to indicate which filter is active
        const filterButtons = Array.from(
          document.querySelectorAll(".esri-button")
        );
        filterButtons.forEach((filterButton) => {
          filterButton.classList.remove("esri-button-active");
        });
        event.target.classList.add("esri-button-active");

        const objectIds = await filterParks(year, featureLayer);

        // Filter layerView
        layerView.filter = {
          objectIds,
        };

        // Filter FeatureTable and perform zoom and sort
        featureTable.clearSelection();
        featureTable.clearSelectionFilter();
        featureTable.selectRows(objectIds);
        featureTable.filterBySelection();
        featureTable.clearSelection();
        featureTable.zoomToSelection();
        featureTable.sortColumn(`F${year}`, "desc");
      });
    });
  })();

  async function filterParks(year, parkLayer) {
    const query = new TopFeaturesQuery({
      topFilter: new TopFilter({
        topCount: 5,
        groupByFields: ["State"],
        orderByFields: [`F${year} DESC`],
      }),
      outFields: ["State, TOTAL, F2018, F2019, F2020, Park"],
      returnGeometry: true,
      cacheHint: false,
    });
    return await parkLayer.queryTopObjectIds(query);
  }
});
