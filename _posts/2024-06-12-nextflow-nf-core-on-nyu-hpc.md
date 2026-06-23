---
layout: post
title: "Nextflow & nf-core on NYU HPC"
date: 2024-06-12
author: "Eric Borenstein"
featured_image: /assets/images/blog/nf-core-rnaseq-featured-image-2.png
header_image: /assets/images/header-blog.jpg
comments: true
---

All nextflow and nf-core pipelines have been successfully configured for use on the HPC Cluster at New York University. The configuration applies required and recommended options in order to have efficient and reliable nextflow runs.

Below is the NYU HPC configuration and the latest version can always be found at [nf-core GitHub](https://github.com/nf-core/configs/blob/master/conf/nyu_hpc.config).

```groovy
params {
    config_profile_description = 'New York University HPC profile provided by nf-core/configs.'
    config_profile_contact = 'HPC@nyu.edu'
    config_profile_url = 'https://hpc.nyu.edu'
    max_memory = 3000.GB
    max_cpus = 96
    max_time = 7.d
}

singularity.enabled = true

process {
    executor = 'slurm'
    clusterOptions = '--export=NONE'
    maxRetries = 3
    errorStrategy = { task.attempt <=3 ? 'retry' : 'finish' }
    cache = 'lenient'
}

executor {
    queueSize = 1900
    submitRateLimit = '20 sec'
}
```

The parameters `max_memory`, `max_cpus`, `max_time`, `queueSize`, and `submitRateLimit` do not hinder your nextflow workflows but sets the resource maximum set by HPC. For example, there is no compute node with 97 CPUs so if your workflow makes the request for 97+ CPUs it will fail. The same logic applies to the other settings.

The `process` code block instructs nextflow on how to run using the cluster scheduler Slurm and how to handle errors by retrying up to 3 times.

## Using the Nextflow Config

For [nf-core](https://nf-co.re/) pipelines, run the pipeline with `-profile nyu_hpc`. This will automatically apply the latest `nyu_hpc.config`.

Example nextflow sbatch script using nf-core pipeline scrnaseq ([https://nf-co.re/scrnaseq/2.6.0](https://nf-co.re/scrnaseq/2.6.0)):

```bash
#!/bin/bash -e
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=1
#SBATCH --cpus-per-task=2
#SBATCH --mem=8GB
#SBATCH --time=24:00:00
#SBATCH --job-name=nextflow
#SBATCH --output=nf_%j.out
# The nextflow job manager does not require a lot 
# of resources, 2 CPU and 8GB mem is more than enough

module purge
module load nextflow/23.04.1

# https://nf-co.re/scrnaseq/2.6.0
nextflow run nf-core/scrnaseq \
   -profile nyu_hpc \ # <- Set the NYU_HPC profile
   --input samplesheet.csv \
   --genome_fasta GRCm38.p6.genome.chr19.fa \
   --gtf gencode.vM19.annotation.chr19.gtf \
   --protocol 10XV2 \
   --aligner star \
   --outdir $SCRATCH/nf_scrnaseq_out
```

For other nextflow pipelines, download the [NYU nf-core config](https://github.com/nf-core/configs/blob/master/conf/nyu_hpc.config) into your nextflow working directory and include it in your nextflow run command as shown below. Note the capital `-C` for the `nyu_hpc.config`, which is provided before the `run` command, and the lower case `-c` for `your.config`, which is provided after the `run` command.

```bash
# Download the config
wget https://raw.githubusercontent.com/nf-core/configs/master/conf/nyu_hpc.config

# Execute the nextflow
nextflow -C nyu_hpc.config run -c your.config main.nf
```

Please reach out to hpc@nyu.edu if there are any questions.
