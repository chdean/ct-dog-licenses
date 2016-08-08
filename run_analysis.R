library(rgdal)
library(rgeos)

output.file <- 'build/licenses.geojson'
ct.boundaries <- 'build/connecticut.geojson'

dir.create('data', showWarnings = FALSE)
setwd('data')

DownloadData <- function(url, file) {
  if (!file.exists(file)) {
    download.file(url, file, method = 'curl')
  }
}

# CT dog license data
license.url <- 'https://data.ct.gov/api/views/j9dq-in2k/rows.csv?accessType=DOWNLOAD'
license.file <- 'ct_dog_licenses.csv'

DownloadData(license.url, license.file)
licenses <- read.csv(license.file)
licenses$TOWN <- sub('.', '', licenses$TOWN)
licenses$TOTALLICENSES <- rowSums(licenses[, -1])

# CT population estimate
population.url <- 'https://www.census.gov/popest/data/cities/totals/2015/files/SUB-EST2015_9.csv'
population.file <- 'SUB-EST2015_9.csv'

DownloadData(population.url, population.file)
pop <- read.csv(population.file)
pop$NAME <- sub(' town| borough| city| city (balance)', '', pop$NAME)
pop$TOWN <- toupper(pop$NAME)
pop <- pop[!duplicated(pop$TOWN), ]

# merge license and pop data
merged <- merge(x = licenses,
                y = pop,
                by = 'TOWN')

merged$LICENSESPERCAP2014 <- merged$X2013.14 / merged$POPESTIMATE2014
merged$LICENSESPERTHOUSAND2014 <- merged$LICENSESPERCAP2014 * 1000
merged$TOTALLICENSESPERCAP <- merged$TOTALLICENSES / merged$POPESTIMATE2014
licensespercap <- merged[, c('TOWN', 'LICENSESPERTHOUSAND2014')]

DownloadShapefile <- function(shapefile) {
  zip.file <- paste0(shapefile, '.zip')
  url <- paste0('http://www2.census.gov/geo/tiger/GENZ2015/shp/',
                zip.file)

  if (!file.exists(zip.file)) {
    download.file(url, zip.file, method = 'curl')
  }

  if (!file.exists(shapefile)) {
    unzip(zip.file,
          exdir = shapefile)
  }
}

# populated places shapefile
places.shapefile <- 'cb_2015_09_place_500k'

DownloadShapefile(places.shapefile)
places <- readOGR(dsn = places.shapefile,
                  layer = places.shapefile)

# merge places with dataset
places$TOWN <- toupper(places$NAME)
towns.licensespercap <- merge(places,
                              licensespercap,
                              by = 'TOWN')

centroids <- SpatialPointsDataFrame(gCentroid(towns.licensespercap, byid = TRUE),
                                    towns.licensespercap@data, match.ID = FALSE)


# state boundaries shapefile
states.shapefile <- 'cb_2015_us_state_20m'

DownloadShapefile(states.shapefile)
states <- readOGR(dsn = states.shapefile,
                  layer = states.shapefile)
connecticut <- states[states$NAME == 'Connecticut', ]

# write output to geojson file
setwd('..')

centroids@data <- centroids@data[, c('NAME', 'LICENSESPERTHOUSAND2014')]
centroids <- centroids[complete.cases(centroids@data), ]

# replace file if it already exists
if (file.exists(output.file)) {
  file.remove(output.file)
}

writeOGR(centroids,
         output.file,
         layer = 'licenses',
         driver = 'GeoJSON',
         check_exists = FALSE)

# write the state boundary to file

if (!file.exists(ct.boundaries)) {
  writeOGR(connecticut,
           ct.boundaries,,
           layer = 'connecticut',
           driver = 'GeoJSON',
           check_exists = FALSE)
}
