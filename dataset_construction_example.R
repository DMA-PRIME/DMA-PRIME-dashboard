library(tidyverse)
library(lubridate)
library(DataCombine)
library(broom.mixed)

## Example for opioid (OUD) data 

## Define quarters 
UB_data_oud = mutate(UB_data_oud, qtime = case_when(ADMYEAR==2016 & ADMMTH %in% c(1:3) ~ 1,
                                                    ADMYEAR==2016 & ADMMTH %in% c(4:6) ~ 2,
                                                    ADMYEAR==2016 & ADMMTH %in% c(7:9) ~ 3,
                                                    ADMYEAR==2016 & ADMMTH %in% c(10:12) ~ 4,
                                                    ADMYEAR==2017 & ADMMTH %in% c(1:3) ~ 5,
                                                    ADMYEAR==2017 & ADMMTH %in% c(4:6) ~ 6,
                                                    ADMYEAR==2017 & ADMMTH %in% c(7:9) ~ 7,
                                                    ADMYEAR==2017 & ADMMTH %in% c(10:12) ~ 8,
                                                    ADMYEAR==2018 & ADMMTH %in% c(1:3) ~ 9,
                                                    ADMYEAR==2018 & ADMMTH %in% c(4:6) ~ 10,
                                                    ADMYEAR==2018 & ADMMTH %in% c(7:9) ~ 11,
                                                    ADMYEAR==2018 & ADMMTH %in% c(10:12) ~ 12,
                                                    ADMYEAR==2019 & ADMMTH %in% c(1:3) ~ 13,
                                                    ADMYEAR==2019 & ADMMTH %in% c(4:6) ~ 14,
                                                    ADMYEAR==2019 & ADMMTH %in% c(7:9) ~ 15,
                                                    ADMYEAR==2019 & ADMMTH %in% c(10:12) ~ 16,
                                                    ADMYEAR==2020 & ADMMTH %in% c(1:3) ~ 17,
                                                    ADMYEAR==2020 & ADMMTH %in% c(4:6) ~ 18,
                                                    ADMYEAR==2020 & ADMMTH %in% c(7:9) ~ 19,
                                                    ADMYEAR==2020 & ADMMTH %in% c(10:12) ~ 20,
                                                    ADMYEAR==2021 & ADMMTH %in% c(1:3) ~ 21,
                                                    ADMYEAR==2021 & ADMMTH %in% c(4:6) ~ 22,
                                                    ADMYEAR==2021 & ADMMTH %in% c(7:9) ~ 23, 
                                                    ADMYEAR==2021 & ADMMTH %in% c(10:12) ~ 24))





## Separate data frame for ZIP code and Quarter
ZIP = numeric()
qtime = numeric()

for (i in 1:length(unique(UB_data_oud$ZIP))) {
  ZIP = c(ZIP, rep(unique(UB_data_oud$ZIP)[i], 24))
  qtime = c(qtime, 1:24)
}


## A new variable that gives a unique row ID for ZIP code and quarter
quart_df = data.frame(ZIP, qtime, row_ID = paste0(ZIP, '_', qtime))

## Hospitalizations counts for each quarter
oud_counts = UB_data_oud %>% group_by(qtime, ZIP) %>% summarize(counts = length(unique(RFA_ID))) 

## Create the same row ID column for hospitalization data and merge it with quart_oud_counts
oud_counts = mutate(oud_counts, row_ID = paste0(ZIP, '_', qtime))
oud_counts = left_join(quart_df, oud_counts[, 3:4], by = 'row_ID')


## Add 0 for NA 
oud_counts$counts[is.na(oud_counts$counts)] = 0


## Arrange data for ZIP code and quarter
oud_counts = arrange(oud_counts, ZIP, qtime)

## Create a new variable for lagged hospitalizations
oud_counts = slide(oud_counts, GroupVar = "ZIP", Var = "counts", NewVar="lag_counts_oud", slideBy = -1)




