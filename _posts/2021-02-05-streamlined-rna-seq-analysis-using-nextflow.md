---
layout: post
title: "Streamlined RNA-Seq Analysis Using Nextflow"
date: 2021-02-05
author: "Mohammed Khalfan"
featured_image: /assets/images/blog/nf-core-rnaseq-featured-image-2.png
header_image: /assets/images/header-blog.jpg
comments: true
---

***UPDATED: April 16, 2024***

[nf-core](https://nf-co.re/) is a community effort to collect a curated set of analysis pipelines built using Nextflow. This post will walk you through running the [nf-core RNA-Seq workflow](https://nf-co.re/rnaseq).

The pipeline uses the STAR aligner by default, and quantifies data using Salmon, providing gene/transcript counts and extensive quality control. Prior to alignment, the pipeline uses Trim Galore to automatically trim low quality bases from the 3' end of reads, and perform adapter trimming, attempting to auto-detect which adapter has been used (from the standard illumina, small rna, and nextera adapters). The pipeline runs a host of other QC tools, including DESeq2 to produce a PCA plot for sample-level QC (note that this requires a minimum of two replicates per library). Results are automatically compiled into a MultiQC report and can be emailed to you upon pipeline completion.

While you have the option to provide reference genome index files to the pipeline, I recommend you provide only the FASTA and GTF files and let the pipeline generate these files the first time you run the workflow (for reproducibility), providing the `--save_reference` parameter so they can be saved for subsequent use (the index building step can be very time-consuming).

Instead of a path to a file, a URL can be supplied to download reference FASTA and GTF files at the start of the pipeline with the `--downloadFasta` and `--downloadGTF` parameters.

Alternatively, reference data can be obtained from [AWS-iGenomes](https://ewels.github.io/AWS-iGenomes/) automatically by providing the `--genome` parameter (ex: `--genome GRCh37`).

As per the documentation, it's a good idea to specify a pipeline version when running the pipeline on your data. This ensures that a specific version of the pipeline code and software are used when you run your pipeline. If you keep using the same tag, you'll be running the same version of the pipeline, even if there have been changes to the code since.

To see what versions are available, go to the nf-core/rnaseq [releases](https://github.com/nf-core/rnaseq/releases) page and find the latest version number -- numeric only (eg. 3.0). Then specify this when running the pipeline with `-r` (one hyphen) -- eg. `-r 3.0`.

The version number will be logged in reports when you run the pipeline, so that you'll know what you used when you look back in the future.

For additional options for trimming, ribosomal RNA removal, UMI-based read de-duplication, other alignment and quantification tools, and more see: [https://nf-co.re/rnaseq/parameters](https://nf-co.re/rnaseq/parameters)

**NOTE: NYU CGSB users will require an additional step (step #1), and have the ability to publish their results to the department JBrowse server (step #6).**

### 1) Rename Fastq Files

**NOTE: This step is for NYU CGSB users only**

nf-core workflows expect standard illumina filenames by default. At NYU CGSB, fastq files are not named using the standard illumina file naming scheme. Therefore, CGSB users will need to run the following script prior to running any nf-core workflow. This script will create a folder within the target directory called 'inames' containing symlinks to the original data that use standard illumina filenames. CGSB users must then provide the path to the files in this 'inames' directory when creating the samplesheet (next step). Run this script as follows, providing the path to the reads and target directory as parameters:

```bash
sh /scratch/work/cgsb/scripts/rename_fastq_files/rename_fastq_files.sh \
    <path_to_reads> \
    <target_dir>
```

Example:

```bash
sh /scratch/work/cgsb/scripts/rename_fastq_files/rename_fastq_files.sh \
    /scratch/cgsb/gencore/out/Gresham/2020-01-10_HV2J2BGXC/merged/ \
    /scratch/$USER/project_dir
```

### 2) Prepare Samplesheet

The pipeline requires a samplesheet in csv format as input. The samplesheet must contain the following five headers: **group, replicate, fastq_1, fastq_2, strandedness**.

It is possible to include multiple runs of the same library in a samplesheet. The `group` and `replicate` identifiers are the same when you have re-sequenced the same sample more than once (e.g. to increase sequencing depth). The pipeline will concatenate the raw reads before alignment.

`strandedness` can be `forward`, `reverse`, `unstranded`, or `auto` in which case the pipeline will attempt to automatically determine the strandedness of the reads.

It is also possible to mix paired-end and single-end reads in a samplesheet.

Below is an example of a samplesheet consisting of both single- and paired-end data. This is for two experimental groups in triplicate, where the last replicate of the `treatment` group has been sequenced twice.

*See the [samplesheet gist](https://gist.github.com/mohammedkhalfan/8645513d262770de93ddb00f35d2a196) for an example.*

More information about samplesheets at the official docs: [https://nf-co.re/rnaseq/usage#introduction](https://nf-co.re/rnaseq/usage#introduction)

### 3) Prepare Config File

Copy this gist into your project directory and provide the path to your samplesheet, FASTA, GTF, and out_root, and your email address if you'd like to be notified when the pipeline completes or if there are any errors.

*See the [config gist](https://gist.github.com/mohammedkhalfan/243fdf411a3c65cc6872e5eaf454e619) for an example.*

### 4) Running the workflow

Note: v3.0 of the RNA-Seq pipeline requires Nextflow 20.11.0-edge or higher.

**On the NYU HPC, you must submit nextflow pipelines as an SBATCH job.**

Copy and paste the code below into a file called `launch-nextflow.s`. Edit the path to your config file (`-c`) and version number (`-r`) as required, and add any additional parameters if necessary.

*See the [launch script gist](https://gist.github.com/mohammedkhalfan/1e016c9fd0acccef98c0986454b9221f) for an example.*

Once you have created this file, submit it to SLURM using the following command:

```bash
sbatch launch-nextflow.s
```

### 5) Output

Once the pipeline has completed, you will find your output files in the `results` directory within the directory you set as `out_root` in the config.

If you provided your email address, you will receive notification via email when your pipeline completes with information pertaining to your analysis as well as a comprehensive MultiQC report attached. If you did not provide your email address, you can find the MultiQC report in the `results` directory.

### 6) JBrowse

CGSB users have the option to push their results to JBrowse for visualization. To push data to JBrowse you will need to request access at [https://forms.bio.nyu.edu](https://forms.bio.nyu.edu) if you have not already done so (requires PI approval). Then, simply execute the following command:

```bash
cgsb_upload2jbrowse \
    -p PI \
    -d DATASET \
    $ref \
    $gff3 \
    --profile nf-rnaseq \
    --root ROOTPATH
```

Example:

```bash
cgsb_upload2jbrowse \
    -p Gresham \
    -d project-name \
    /path/to/ref.fa.gz \
    /path/to/ref.gff3 \
    --profile nf-rnaseq \
    --root /scratch/netID/rnaseq_project/results/
```

### 7) Citing

If you use nf-core/rnaseq for your analysis, please cite it using the following doi: [10.5281/zenodo.1400710](https://doi.org/10.5281/zenodo.1400710)

In addition, cite the nf-core publication as follows:

***The nf-core framework for community-curated bioinformatics pipelines.***
*Philip Ewels, Alexander Peltzer, Sven Fillinger, Harshil Patel, Johannes Alneberg, Andreas Wilm, Maxime Ulysse Garcia, Paolo Di Tommaso & Sven Nahnsen.*
*Nat Biotechnol. 2020 Feb 13. doi: 10.1038/s41587-020-0439-x.*

## Additional Comments

Recently, I observed this warning message immediately upon launching the pipeline (for documentation purposes, this was version 3.14.0):

```
WARN: ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Multiple config files detected!
  Please provide pipeline parameters via the CLI or Nextflow '-params-file' option.
  Custom config files including those provided by the '-c' Nextflow option can be
  used to provide any configuration except for parameters.

  Docs: https://nf-co.re/usage/configuration#custom-configuration-files
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

It appears that we need to move our parameters into a separate JSON file, and provide this file to the pipeline using the `-params-file` option. According to the [documentation](https://nf-co.re/usage/configuration#custom-configuration-files), this is necessary for nf-core pipelines using DSL2, which was implemented in version 2.0 of this pipeline. The warning message above, displayed upon running the pipeline, instructs us to provide pipeline parameters via the `-params-file` option. However, the documentation clarifies that "For Nextflow DSL2 nf-core pipelines -- parameters defined in the parameter block in `custom.config` files **WILL NOT** override defaults in `nextflow.config`", which might mean that you can keep your parameters in your `nextflow.config` file. This suggests that even though it's possible to keep parameters in your nextflow.config file, as evidenced by my tests where the pipeline runs with all parameters in the nextflow.config file, you will still receive the warning message. Similarly, the warning will appear even when using a JSON file with the `-params-file` option. If you choose or need to use a JSON file for your parameters as indicated in the warning message, here is how you would proceed:

Create the JSON file with your parameters as shown below. Save this file as `nf-params.json`. (See documentation for JSON format [here](https://www.w3schools.com/js/js_json_syntax.asp))

```json
{
  "input": "/path/to/samplesheet.csv",
  "fasta": "/path/to/ref.fa",
  "gtf": "/path/to/ann.gtf",
  "email": "netID@nyu.edu",
  "outdir": "/scratch/netID/rnaseq_project"
}
```

Update your nextflow command to include `-params-file` and the path to your json file.

```bash
nextflow run nf-core/rnaseq \
        -profile singularity \
        -c nextflow.config \
        -params-file nf-params.json \
        -r 3.14.0 \
        --save_reference
```
