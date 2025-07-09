#!/bin/bash

#SBATCH --job-name DMA-PRIME-other-disease-data-processing
#SBATCH --partition=dmaprime
#SBATCH --nodes 1
#SBATCH --ntasks 1
#SBATCH --cpus-per-task 1
#SBATCH --mem 4gb
#SBATCH --time 00:20:00
#SBATCH --output=/dev/null
#SBATCH --error=/dev/null

cd /project/liorr/dmaprime/visualization_data/scripts

/project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python /project/liorr/dmaprime/visualization_data/scripts/process_other_infectious_diseases_data.py >> temp.txt
if [ $? -ne 0 ]; then
python3 sendmail.py gausten@clemson.edu "DMA-PRIME Disease Outbreak Data Processing Errors" "$(cat temp.txt)"
else
/project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python encrypt.py "/project/liorr/dmaprime/visualization_data/download/supplementary/encrypt_key.bin" "/project/liorr/dmaprime/visualization_data/processed/other_infectious_diseases" "/project/liorr/dmaprime/visualization_data/download/processed/other_infectious_diseases"
fi
rm temp.txt
