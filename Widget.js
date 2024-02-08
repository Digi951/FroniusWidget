/*
fronius.js V1.02
Please run Script with Scriptable with iOS14
Script/Widget nutzt die API von Fronius
Anzeige einer Uebersicht ausgewählter Daten der API

Gerätetyp: 
- für Fronius Wechselrichter GT
 
Parameter:
- IP-Adresse des Fronius Wechselrichters; bitte den Parameter in die untere URL eingeben
*/

//########## SETUP ###########

const BACKGROUND_COLOR = Color.dynamic(
  new Color("#ffffff"),
  new Color("#161618")
);
const TEXT_COLOR = Color.dynamic(new Color("000000"), new Color("#ffffff"));

const TEXT_COLOR_CHARGE = Color.dynamic(new Color("80bb64"), new Color("#80bb64"));
const TEXT_COLOR_DISCHARGE = Color.dynamic(new Color("#d02c29"), new Color("#d02c29"));
const TEXT_COLOR_PV = Color.dynamic(new Color("efc142"), new Color("#efc142"));
const TEXT_COLOR_CONSUMPTION = Color.dynamic(new Color("7eaeca"), new Color("#7eaeca"));
const TEXT_COLOR_BATTERY = Color.dynamic(new Color("80bb64"), new Color("#80bb64"));
const TEXT_COLOR_BATTERY_EMPTY = Color.dynamic(new Color("#d02c29"), new Color("#d02c29"));
const TEXT_COLOR_BATTERY_HALFCHARGED = Color.dynamic(Color.orange(), Color.orange());
const TEXT_COLOR_BATTERY_FULL = Color.dynamic(Color.green(), Color.green());
const TEXT_COLOR_GRID = Color.dynamic(new Color("999999"), new Color("#999999"));

const MEDIUM_WIDGET_FONT = Font.mediumSystemFont(16);

//########## END OF SETUP ##########

const apiUrl = "http://192.168.178.75/solar_api/v1/GetPowerFlowRealtimeData.fcgi";

let parameters = await args.widgetParameter;
if (parameters != null) {
  parameters = parameters.toLowerCase();
} else {
  parameters = "icloud";
}

let widgetSize = config.widgetFamily;

let fm = FileManager.iCloud();
if (parameters.includes("local")) {
  fm = FileManager.local();
} else if (parameters.includes("icloud")) {
  fm = FileManager.iCloud();
}

let dir = fm.joinPath(fm.documentsDirectory(), "fronius-widget");
let path = fm.joinPath(dir, "fronius-data.json");

if (!fm.fileExists(dir)) {
  fm.createDirectory(dir);
}

let wifi = false;
let df = new DateFormatter();
df.useShortDateStyle();

// FONTS USED BY THE WIDGET
let thin_font = Font.regularRoundedSystemFont(13);
let small_font = Font.regularRoundedSystemFont(11);
let bold_font = Font.heavyRoundedSystemFont(13);
let title_font = Font.heavyRoundedSystemFont(11);

if (widgetSize == "medium") {
  thin_font = Font.regularRoundedSystemFont(15);
  small_font = Font.regularRoundedSystemFont(13);
  bold_font = Font.heavyRoundedSystemFont(15);
  title_font = Font.heavyRoundedSystemFont(17);
}

class FroniusRealTimeData{
  constructor(
    pvProduction,
    consumption,
    batterySoc,
    batteryLoad, // - charge / + discharge
    grid, // - to grid / + from grid
    timeStamp
  ) {
    this.pvProduction = pvProduction;
    this.consumption = consumption;
    this.batterySoc = batterySoc;    
    this.batteryLoad = batteryLoad;
    this.grid = grid;
    this.timeStamp = timeStamp;
  }
}

// Widget creation

function createFirstWidget() {
  first = new ListWidget();
  first.addText(
    "Daten können ohne freigeschaltete API nur lokal oder über VPN bezogen werden..."
  );
  return first;
}

// ###SMALL###
async function createSmallWidget(data) {
  var widget = new ListWidget();
  var header_stack = widget.addStack();
  var title = header_stack.addText("PV-Anlage");
  
  title.font = title_font; 
  title.Color = TEXT_COLOR; 
  
  header_stack.addSpacer();
  
  //let weatherImage = SFSymbol.named("sun.max.fill").image;  
  //var weatherSymbol = header_stack.addImage(weatherImage);
  //weatherSymbol.imageSize = new Size(17, 17);
  //weatherSymbol.tintColor = Color.yellow();  
  
  widget.addSpacer();  
  
  // --- PRODUCTION---
  
  var productionStack = widget.addStack(); 
  
  let pvSymbolImage = SFSymbol.named("sun.max.fill").image;  
  var pvSymbol = productionStack.addImage(pvSymbolImage);
  pvSymbol.imageSize = new Size(17, 17);
  pvSymbol.tintColor = TEXT_COLOR_PV;  
  
  var pvProduction_txt = productionStack.addText(
    " " + data.pvProduction); 
  pvProduction_txt.font = Font.mediumSystemFont(12);
  pvProduction_txt.textColor = TEXT_COLOR_PV;
  
  // ---CONSUMPTION---
    
  var consumptionStack = widget.addStack();
  consumptionStack.layoutHorizontally();
    
  let consumptionSymbolImage = SFSymbol.named("lightbulb.max.fill").image;  
  var consumptionSymbol = consumptionStack.addImage(consumptionSymbolImage);
  consumptionSymbol.imageSize = new Size(15, 15);
  consumptionSymbol.tintColor = TEXT_COLOR_CONSUMPTION;  
  
  var consumption_txt = consumptionStack.addText(
    " " + data.consumption); 
    
  consumption_txt.font = Font.mediumSystemFont(12);
  consumption_txt.textColor = TEXT_COLOR_CONSUMPTION;
  
  // ---BATTERY---
    
  var batteryStack = widget.addStack();
    
  let batterySymbolImage = SFSymbol.named("bolt.batteryblock.fill").image;  
  var batterySymbol = batteryStack.addImage(batterySymbolImage);
  batterySymbol.imageSize = new Size(14, 14);
  batterySymbol.tintColor = TEXT_COLOR_BATTERY;
    
  var batteryLoad_txt = batteryStack.addText(
    " " + data.batteryLoad + "W");
    
  // COLORING BASED ON DATA
  let batteryLoadNum = parseFloat(data.batteryLoad);
  
  if(batteryLoadNum < 0.0){
    batteryLoad_txt.textColor = TEXT_COLOR_CHARGE;
  } else{
    batteryLoad_txt.textColor = TEXT_COLOR_DISCHARGE;
  }
  
  let socNum = parseFloat(data.batterySoc);
  
  batteryLoad_txt.font = Font.mediumSystemFont(12);
  
  var separator = batteryStack.addText(" / ");
  separator.font = Font.mediumSystemFont(12);
  separator.textColor = TEXT_COLOR;
  
  var batterySoc_txt = batteryStack.addText(
    data.batterySoc + "%");
    
  batteryLoad_txt.font = Font.mediumSystemFont(12);
  
  // COLORING BASED ON DATA PERCENTAGE
  if(socNum >= 0.0 && socNum < 25.0) {
    batterySoc_txt.textColor = TEXT_COLOR_BATTERY_EMPTY
  } else if(socNum > 25.0 && socNum < 50.0 ) {
    batterySoc_txt.textColor = Color.orange();
  } else if(socNum > 50.0 && socNum < 75.0 ) {
    batterySoc_txt.textColor = TEXT_COLOR_PV;
  } else if(socNum > 75.0 && socNum <= 100.0) {
    batterySoc_txt.textColor = TEXT_COLOR_CHARGE;
  } else {
    batterySoc_txt.textColor = Color.gray();
  } 
  
  batterySoc_txt.font = Font.mediumSystemFont(12);
  
  // ---GRID---
    
  var gridStack = widget.addStack();
  let gridSymbolImage = SFSymbol.named("bolt.fill").image;  
  var gridSymbol = gridStack.addImage(gridSymbolImage);
  gridSymbol.imageSize = new Size(15, 15);
  gridSymbol.tintColor = Color.gray();
        
  var grid_txt = gridStack.addText(
    " " + data.grid);
    
  grid_txt.font = Font.mediumSystemFont(12);
  
  let gridNum = parseFloat(data.grid);
  
  if(gridNum < 0.0){
    grid_txt.textColor = TEXT_COLOR_CHARGE;
  } else{
    grid_txt.textColor = TEXT_COLOR_DISCHARGE;
  }
    
  widget.addSpacer();
  
  // --SYNC--
  
  var syncStack = widget.addStack();    
  let syncSymbolImage = SFSymbol.named("arrow.triangle.2.circlepath").image;  
  var syncSymbol = syncStack.addImage(syncSymbolImage);
  syncSymbol.imageSize = new Size(13, 13);
  syncSymbol.tintColor = Color.gray();
      
  var footer = syncStack.addText(
    " " + data.timeStamp + "h");
    
  footer.font = Font.mediumSystemFont(10);

  footer.Color = TEXT_COLOR;
  
  // let gradient = new LinearGradient()
  // gradient.locations = [0, 1]
  // gradient.colors = [
  //  new Color("141414"),
  //  new Color("13233F")
  //]
  widget.background = BACKGROUND_COLOR
  
  return widget;
}

  // ###MEDIUM###
async function createMediumWidget(data){
  var widget = new ListWidget();
  var header_stack = widget.addStack();
  var title = header_stack.addText("PV-Anlage");
  
  title.font = title_font; 
  title.Color = TEXT_COLOR; 
  
  header_stack.addSpacer();
  
  //let weatherImage = SFSymbol.named("sun.max.fill").image;  
  //var weatherSymbol = header_stack.addImage(weatherImage);
  //weatherSymbol.imageSize = new Size(17, 17);
  //weatherSymbol.tintColor = Color.yellow();  
  
  widget.addSpacer(); 
  
  // --- PRODUCTION---
  
  var productionStack = widget.addStack(); 
  
  let pvSymbolImage = SFSymbol.named("sun.max.fill").image;  
  var pvSymbol = productionStack.addImage(pvSymbolImage);
  pvSymbol.imageSize = new Size(17, 17);
  pvSymbol.tintColor = TEXT_COLOR_PV;  
  
  var pvProduction_txt = productionStack.addText(
    " Produziert: "); 
  pvProduction_txt.font = MEDIUM_WIDGET_FONT;
  pvProduction_txt.textColor = TEXT_COLOR_PV;
  
  var pvProductionValue_txt = productionStack.addText(
    " " + data.pvProduction); 
  pvProductionValue_txt.font = MEDIUM_WIDGET_FONT;
  pvProductionValue_txt.textColor = TEXT_COLOR_PV;
  
  // ---CONSUMPTION---
    
  var consumptionStack = widget.addStack();
  consumptionStack.layoutHorizontally();
    
  let consumptionSymbolImage = SFSymbol.named("lightbulb.max.fill").image;  
  var consumptionSymbol = consumptionStack.addImage(consumptionSymbolImage);
  consumptionSymbol.imageSize = new Size(15, 15);
  consumptionSymbol.tintColor = TEXT_COLOR_CONSUMPTION;  
  
  var consumption_txt = consumptionStack.addText(
    " Verbrauch: ");     
  consumption_txt.font = MEDIUM_WIDGET_FONT;
  consumption_txt.textColor = TEXT_COLOR_CONSUMPTION;
  
  var consumptionValue_txt = consumptionStack.addText(
    " " + data.consumption);     
  consumptionValue_txt.font = MEDIUM_WIDGET_FONT;
  consumptionValue_txt.textColor = TEXT_COLOR_CONSUMPTION;
  
  // ---BATTERY---
    
  var batteryStack = widget.addStack();
    
  let batterySymbolImage = SFSymbol.named("bolt.batteryblock.fill").image;  
  var batterySymbol = batteryStack.addImage(batterySymbolImage);
  batterySymbol.imageSize = new Size(15, 15);
  batterySymbol.tintColor = TEXT_COLOR_BATTERY;
    
  var batteryLoad_txt = batteryStack.addText(
    " Akku: ");
  batteryLoad_txt.font = MEDIUM_WIDGET_FONT;
  batteryLoad_txt.textColor = TEXT_COLOR_BATTERY;
    
  var batteryLoadValue_txt = batteryStack.addText(
    " " + data.batteryLoad + "W");
    
  // COLORING BASED ON DATA
  let batteryLoadNum = parseFloat(data.batteryLoad);
  
  if(batteryLoadNum < 0.0){
    batteryLoadValue_txt.textColor = TEXT_COLOR_CHARGE;
  } else{
    batteryLoadValue_txt.textColor = TEXT_COLOR_DISCHARGE;
  }
  
  let socNum = parseFloat(data.batterySoc);
  
  batteryLoadValue_txt.font = MEDIUM_WIDGET_FONT;
  
  var separator = batteryStack.addText(" / ");
  separator.font = MEDIUM_WIDGET_FONT;
  separator.textColor = TEXT_COLOR;
  
  var batterySoc_txt = batteryStack.addText(
    data.batterySoc + "%");
    
  batteryLoad_txt.font = MEDIUM_WIDGET_FONT;
  
  // COLORING BASED ON DATA PERCENTAGE
  if(socNum >= 0.0 && socNum < 25.0) {
    batterySoc_txt.textColor = TEXT_COLOR_BATTERY_EMPTY
  } else if(socNum > 25.0 && socNum < 50.0 ) {
    batterySoc_txt.textColor = Color.orange();
  } else if(socNum > 50.0 && socNum < 75.0 ) {
    batterySoc_txt.textColor = TEXT_COLOR_PV;
  } else if(socNum > 75.0 && socNum <= 100.0) {
    batterySoc_txt.textColor = TEXT_COLOR_CHARGE;
  } else {
    batterySoc_txt.textColor = Color.gray();
  } 
  
  batterySoc_txt.font = MEDIUM_WIDGET_FONT;
  
  // ---GRID---
    
  var gridStack = widget.addStack();
  let gridSymbolImage = SFSymbol.named("bolt.fill").image;  
  var gridSymbol = gridStack.addImage(gridSymbolImage);
  gridSymbol.imageSize = new Size(15, 15);
  gridSymbol.tintColor = TEXT_COLOR_GRID;
        
  var grid_txt = gridStack.addText(
    " Netz: ");    
  grid_txt.font = MEDIUM_WIDGET_FONT;
  grid_txt.textColor = TEXT_COLOR_GRID;
        
  var gridValue_txt = gridStack.addText(
    " " + data.grid);    
  gridValue_txt.font = MEDIUM_WIDGET_FONT;
  
  let gridNum = parseFloat(data.grid);
  
  if(gridNum < 0.0){
    gridValue_txt.textColor = TEXT_COLOR_CHARGE;
  } else{
    gridValue_txt.textColor = TEXT_COLOR_DISCHARGE;
  }
    
  widget.addSpacer();  
    
  // --SYNC--
  
  var syncStack = widget.addStack();    
  let syncSymbolImage = SFSymbol.named("arrow.triangle.2.circlepath").image;  
  var syncSymbol = syncStack.addImage(syncSymbolImage);
  syncSymbol.imageSize = new Size(13, 13);
  syncSymbol.tintColor = Color.gray();
     
  var footer = syncStack.addText(
    " Zuletzt aktualisiert: ");
  footer.font = Font.mediumSystemFont(10);
  footer.Color = TEXT_COLOR;    
       
  var footerValue = syncStack.addText(
    " " + data.timeStamp + "h");    
  footerValue.font = Font.mediumSystemFont(10);
  footerValue.Color = TEXT_COLOR;
  
  widget.background = BACKGROUND_COLOR
  
  return widget;
}

async function createErrorWidget(err) {
  err_widget = new ListWidget();
  err_widget.addText(err);
  return err_widget;
}

// Get all data and process
async function getFromApi() {
  let request = new Request(apiUrl);
  request.headers = {
    "User-Agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1",
  };
  data = await request.loadJSON();
  return data;
}

async function getFromFile() {
  await fm.downloadFileFromiCloud(path);
  data = await JSON.parse(fm.readString(path));
  console.log("Fetching data from file was successful");
  return data;
}

// Datamapping
async function processData(data) {
  var pvProduction = data.Body.Data.Site.P_PV;
  let num = parseFloat(pvProduction);
  if(num >= 1000.0){
    num = num / 1000.0
    pvProduction = num.toFixed(1).toString() + "kW";
  } else{
    pvProduction = num.toFixed(1).toString() + "W";
  }
  
  var consumption = data.Body.Data.Site.P_Load;
  num = parseFloat(consumption);
  if(num >= 1000.0){
    num = num / 1000.0
    consumption = num.toFixed(1).toString() + "kW";
  } else{
    consumption = num.toFixed(1).toString() + "W";
  }
  
  var batterySoc = data.Body.Data.Inverters['1'].SOC;
  
  var batteryLoad = data.Body.Data.Site.P_Akku;
  num = parseFloat(batteryLoad);
  batteryLoad = num.toFixed(1).toString();
  
  var grid = data.Body.Data.Site.P_Grid;
  num = parseFloat(grid);
  if(num >= 1000.0){
    num = num / 1000.0
    grid = num.toFixed(1).toString() + "kW";
  } else{
    grid = num.toFixed(1).toString() + "W";
  }
  
  var timeStamp = data.Head.Timestamp;
  const date = new Date(timeStamp);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  
  const formattedTime = `${hoursStr}:${minutesStr}`;

  var froniusData = new FroniusRealTimeData(
    pvProduction,
    consumption,
    batterySoc,
    batteryLoad,
    grid,
    formattedTime
  );

  return froniusData;
}

// Filehandling
async function saveData(data) {
  data.savedDate = Date.now();
  fm.writeString(path, JSON.stringify(data));
  console.log("Saved new data to file");
}

// Request
// Get Data from API
try {
  data = await getFromApi();  
  saveData(data);
} catch(e) {
  wifi = true;
  console.log(
    "Couldnt fetch data from API. Wifi still on? Trying to read from file."
  );
}

// Display Widget
if (!fm.fileExists(path)){
  console.log("File doesnt exist. Looks like your first init.");
  first = await createFirstWidget();
  Script.setWidget(first);
} else {
  data = await getFromFile();
  processedData = await processData(data);
  
  widget = createErrorWidget("Widget couldnt be created");
  
  switch (widgetSize) {    
    case "medium":
      widget = await createMediumWidget(processedData);
      break;
    default:
      widget = await createSmallWidget(processedData);
  }

  widget.presentSmall();
  // widget.url = "https://";

  Script.setWidget(widget);
}

Script.complete();
