---
layout: post
title: "Beginner's Guide to Bioinformatics Tools for Analyzing Microbiome Data"
date: 2019-11-18
author: "Lingdi Zhang"
featured_image: /assets/images/blog/microbiome-featured-image.jpg
header_image: /assets/images/header-blog.jpg
comments: true
---

Next-generation sequencing technologies have allowed for sequencing at a low cost and fast speed, and is used more and more to study microbial communities. RNA-seq metatranscriptome and WGS metagenome studies aim to investigate microbial communities at genome and transcriptome levels. In this article, I will introduce a few tools that I frequently use to analyze metagenomic and metatranscriptomic datasets.

## Generating Microbial community taxonomy profiles

Since a variety of microbes live in the microbial community at differential relative abundances, the first question researchers usually ask is who is present and at what relative abundance. [Kraken](https://ccb.jhu.edu/software/kraken2/) is one of the most frequently used tools to classify microbial community taxonomic information. Kraken uses a K-mer based searching algorithm to assign taxonomic labels to the reads (Fig. 1). Another frequently used tool is [MetaPhlan](http://huttenhower.sph.harvard.edu/metaphlan2), which uses clade-specific marker genes to study the microbiome taxonomic composition (Fig. 2). Both approaches are popularly used in microbiome researches and efficient in run time.

![Figure 1. Kraken uses a K-mer based searching algorithm to assign taxonomic labels to the reads](https://lh5.googleusercontent.com/OjLR_2tPJ9vsKQiMauIjMwElo6dxebCUdeB4pz4llYCSdUMJg7bZVw7TvI7j279m-2qOmGXiSt-ZmQAjfY60wMlhwXRwoxqUEIUCQAE_IqH0S7Vhhw1m8_gS8zw3icK9GnL7FJ-KhjfCf1PHsw)

*Figure 1. Kraken uses a K-mer based searching algorithm to assign taxonomic labels to the reads*

![Figure 2. MetaPhlan uses clade-specific marker genes to study the microbiome taxonomic composition](https://lh6.googleusercontent.com/gLV6ejdgu9auedVMF6N9mSjQFJi3M0UlD9f4Er-6bbM-Fep8yDPM6e4UONDhqdX-rORJPbcAg9lJ92s0MuGqfwQHzsryHhXMwdO4qZiVKu_uXCe9ayn2tvZyXtVSiqQHdqCpBMJ2hd4K3qTdpQ)

*Figure 2. MetaPhlan uses clade-specific marker genes to study the microbiome taxonomic composition*

Figures from [Wood and Salzberg, 2014](https://genomebiology.biomedcentral.com/articles/10.1186/gb-2014-15-3-r46) and [MetaPhlAn Pipelines Tutorial](https://bitbucket.org/nsegata/metaphlan/wiki/MetaPhlAn_Pipelines_Tutorial)

## Generating Microbial community gene expression profiles

Another question researchers investigate with regards to metagenomic and metatranscriptomic datasets is the presence/expression of bacterial genes in the microbial community. HUMAnN2 is one of the most popular tools in analyzing the bacterial gene expression profiles. Different levels of information can be learned through running HUMAnN2, the reads are first assigned to bacterial taxa and both the mapped and unmapped reads are searched against the protein databases for gene assignments. Gene family abundance, pathway abundance and coverage can be learned from the HUMAnN2 output.

![Figure 3. HUMaN2 workflow](https://lh4.googleusercontent.com/l8jG5CRJ9QtJQdddc7vO6kAUk9w92L10sdQvhEAcwqj3IoZH-JrXuMZ-3339YSeIgaHADBO5_vmKdi8Cns68wz_7c4OvriBg_LLDU58Pplkm1O_D3rur_XFMntMZ_4Yv_8_NRRvd-0MpQBJogA)

*Figure 3. HUMaN2 workflow*

Figure from [HUMAnN2 Wiki](https://bitbucket.org/biobakery/humann2/wiki/Home)

## Metagenome and metatranscriptome assembly

A different approach to investigate the microbial community is through assembling the reads into contigs. This allows researchers to identify novel bacterial genomes and genes. A lot of assemblers are designed specifically for metagenomic datasets, such as metaSPAdes and MEGAHIT. These assemblers use k-mer based De Bruijn graphs, which have advantages in handling errors in reads and DNA repeats and used a lot in metagenome assembly.

![Figure 4. K-mer based De Bruijn graphs used in genome assembly](https://lh6.googleusercontent.com/6v7OqGMwnyGjNBiGA934KcmkkeQPtdmDcCqXIXolpnKZeiZWPMT-j1p3XK2TVmmejcJ4PgZI4d9jwbLAqHFQb0V_62Xempux1G6IWGlewyIofQTJVsev6PfSJIaJP9aqiCvossKlknJHPpdV_A)

*Figure 4. K-mer based De Bruijn graphs used in genome assembly*

Figure from [K-mer - Wikipedia](https://en.wikipedia.org/wiki/K-mer)

## Summary

Metagenomic and metatranscriptomic datasets contain vast amounts of information including taxonomy classification and gene expression information. Many tools have been developed to extract information from these datasets to allow researchers investigate the microbial community and ask questions of their interest. I am only briefly introducing a few popular tools developed for different purposes. I hope this can be helpful for people who are interested in microbiome research and looking for software to learn the information they are interested in. For more details about the above-mentioned software please see the links and the references below.

**For a step-by-step tutorial on analyzing metagenomic data using the above mentioned tools, check out the tutorial at: [https://learn.gencore.bio.nyu.edu/metgenomics/](https://learn.gencore.bio.nyu.edu/metgenomics/)**

## Additional material

1. Nurk, S., et al., *metaSPAdes: a new versatile metagenomic assembler.* Genome Res, 2017. **27**(5): p. 824-834.
2. Franzosa, E.A., et al., *Species-level functional profiling of metagenomes and metatranscriptomes.* Nat Methods, 2018. **15**(11): p. 962-968.
3. Li, D., et al., *MEGAHIT: an ultra-fast single-node solution for large and complex metagenomics assembly via succinct de Bruijn graph.* Bioinformatics, 2015. **31**(10): p. 1674-6.
